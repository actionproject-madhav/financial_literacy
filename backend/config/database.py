"""
Database configuration for PostgreSQL with SQLAlchemy
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker, declarative_base
from sqlalchemy.pool import NullPool

# Get database URL from environment variable
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://localhost/finlit')

# Handle Heroku's postgres:// URL scheme (needs to be postgresql://)
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

# Create engine with connection pool settings
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using them
    pool_recycle=300,    # Recycle connections after 5 minutes
    echo=False,          # Set to True for SQL query logging
    future=True
)

# Create session factory with scoped_session for thread safety
session_factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Session = scoped_session(session_factory)

# Create declarative base for models
Base = declarative_base()

def init_db():
    """Initialize database - create all tables"""
    # Import all models to ensure they're registered with Base
    from models import (
        learner, knowledge_component, learning_item,
        item_kc_mapping, learner_skill_state, interaction,
        gamification, cultural_context, kc_prerequisite
    )

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

def get_db():
    """Get database session - use this in Flask routes"""
    db = Session()
    try:
        yield db
    finally:
        db.close()

def close_db():
    """Close database connection"""
    Session.remove()
