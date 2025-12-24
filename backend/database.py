from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    def __init__(self):
        self.mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
        self.database_name = os.getenv('DATABASE_NAME', 'app_database')
        
        self.client = None
        self.db = None
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
                self.client = MongoClient(
                    self._mongo_uri,
                    tls=True,
                    tlsAllowInvalidCertificates=False,
                    serverSelectionTimeoutMS=30000
                )
            
            self.db = self.client[self.database_name]
            # Test connection
            self.client.admin.command('ping')
            return True
            
        except Exception as e:
            print(f"MongoDB connection error: {e}")
            self.client = None
            self.db = None
            return False
    
    @property
    def is_connected(self):
        """Check if database is connected"""
        return self._ensure_connection()
