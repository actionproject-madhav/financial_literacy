from pymongo import MongoClient
import os
from dotenv import load_dotenv
from mongo_collections import FinLitCollections

load_dotenv()

class Database:
    def __init__(self):
        self.mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
        self.database_name = os.getenv('DATABASE_NAME', 'app_database')

        self.client = None
        self.db = None
        self.collections = None
        self._connection_attempted = False

        # Configure connection based on URI
        if 'localhost' in self.mongo_uri:
            self._mongo_uri = self.mongo_uri
            self._is_local = True
        else:
            # MongoDB Atlas - ensure TLS
            mongo_uri = self.mongo_uri
            if 'ssl=true' not in mongo_uri.lower() and 'tls=true' not in mongo_uri.lower():
                separator = '&' if '?' in mongo_uri else '?'
                mongo_uri = f"{mongo_uri}{separator}tls=true"
            self._mongo_uri = mongo_uri
            self._is_local = False
    
    def _ensure_connection(self):
        """Lazy connection - connect on first use"""
        if self.client is not None:
            return True
        
        if self._connection_attempted:
            return False
        
        self._connection_attempted = True
        
        try:
            if self._is_local:
                self.client = MongoClient(
                    self._mongo_uri,
                    serverSelectionTimeoutMS=10000
                )
            else:
                import ssl
                # Try with more lenient SSL settings for VPN connections
                # Note: tlsAllowInvalidCertificates=True is less secure but may help with VPN issues
                self.client = MongoClient(
                    self._mongo_uri,
                    tls=True,
                    tlsAllowInvalidCertificates=False,  # Keep secure by default
                    serverSelectionTimeoutMS=30000,
                    connectTimeoutMS=30000,
                    socketTimeoutMS=30000,
                    retryWrites=True
                )
            
            self.db = self.client[self.database_name]
            # Test connection
            self.client.admin.command('ping')

            # Initialize FinLit collections
            self.collections = FinLitCollections(self.db)
            print("✅ FinLit collections initialized")

            return True
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌ MongoDB connection error: {error_msg}")
            
            # Check if it's a network/IP access issue
            if 'Connection reset' in error_msg or 'SSL handshake failed' in error_msg:
                print("\n💡 VPN/IP Access Issue Detected")
                print("   MongoDB Atlas blocks VPN connections by default.")
                print("\n   Solutions:")
                print("   1. Whitelist your VPN IP in MongoDB Atlas:")
                print("      - Go to: Network Access → Add IP Address")
                print("      - Add your current IP (check with: curl ifconfig.me)")
                print("   2. Or temporarily disable VPN for MongoDB operations")
                print("   3. Or allow all IPs (0.0.0.0/0) - less secure but works")
            
            self.client = None
            self.db = None
            return False
    
    @property
    def is_connected(self):
        """Check if database is connected"""
        return self._ensure_connection()

    def initialize_indexes(self):
        """Create all database indexes"""
        if not self._ensure_connection():
            print(" Cannot create indexes - database not connected")
            return False

        try:
            self.collections.create_indexes()
            return True
        except Exception as e:
            print(f" Error creating indexes: {e}")
            return False
