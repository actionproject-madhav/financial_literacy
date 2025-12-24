"""
Database configuration for PostgreSQL with SQLAlchemy
"""
import os
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Initialize Flask-SQLAlchemy
db = SQLAlchemy()
migrate = Migrate()

def get_database_url():
    """Get database URL from environment variable"""
    database_url = os.getenv('DATABASE_URL', 'postgresql://localhost/finlit')

    # Handle Heroku's postgres:// URL scheme (needs to be postgresql://)
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)

    return database_url

def init_app(app):
    """Initialize database with Flask app"""
    # Configure SQLAlchemy
    app.config['SQLALCHEMY_DATABASE_URI'] = get_database_url()
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,  # Verify connections before using them
        'pool_recycle': 300,    # Recycle connections after 5 minutes
        'echo': False           # Set to True for SQL query logging
    }

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    return app

def init_db_tables(app):
    """Initialize database - create all tables"""
    with app.app_context():
        # Import all models to ensure they're registered
        import models

        # Create all tables
        db.create_all()
        print("PostgreSQL database tables created successfully!")

def get_db_session():
    """Get database session - use this in Flask routes"""
    return db.session
