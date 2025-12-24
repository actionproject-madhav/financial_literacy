# PostgreSQL Database Migration Guide

## Overview
This guide covers the migration from MongoDB to PostgreSQL for the FinLit learning platform. The implementation includes comprehensive SQLAlchemy models with Flask-SQLAlchemy and Flask-Migrate for schema management.

## ✅ Completed Steps

### 1. Dependencies Installed
All required packages have been installed:
- `psycopg2-binary>=2.9.0` - PostgreSQL adapter
- `SQLAlchemy>=2.0.0` - ORM framework
- `Flask-SQLAlchemy>=3.1.0` - Flask integration
- `Flask-Migrate>=4.0.0` - Database migrations

### 2. Database Configuration
- **File**: `config/database.py`
- Configured Flask-SQLAlchemy with connection pooling
- Handles Heroku's `postgres://` URL scheme
- Environment variable: `DATABASE_URL`

### 3. SQLAlchemy Models Created

#### Core Models:
- **Learner** (`models/learner.py`)
  - User profiles, XP, streaks, immigration status
  - Financial goals and preferences

- **KnowledgeComponent** (`models/knowledge_component.py`)
  - Skills and concepts with hierarchical structure
  - Difficulty tiers, Bloom's taxonomy levels

- **LearningItem** (`models/learning_item.py`)
  - Questions, videos, interactive content
  - IRT parameters (difficulty, discrimination)
  - Cultural adaptations support

- **ItemKCMapping** (`models/item_kc_mapping.py`)
  - Many-to-many relationship between items and skills
  - Weighted mappings

- **LearnerSkillState** (`models/learner_skill_state.py`)
  - Per-user mastery tracking
  - Spaced repetition (FSRS algorithm support)
  - Unlock/mastery status

- **Interaction** (`models/interaction.py`)
  - Student response logging
  - Performance analytics
  - Indexed for efficient querying

#### Gamification Models:
- **Achievement** (`models/gamification.py`)
  - Badges and achievements
  - XP rewards

- **LearnerAchievement** (`models/gamification.py`)
  - User achievement tracking

- **DailyProgress** (`models/gamification.py`)
  - Daily goal tracking
  - Streak management

#### Cultural Context Models:
- **QuestionTemplate** (`models/cultural_context.py`)
  - Dynamic question generation
  - Variable substitution

- **CulturalContext** (`models/cultural_context.py`)
  - Country-specific context
  - Cultural comparisons and warnings

#### Prerequisite System:
- **KCPrerequisite** (`models/kc_prerequisite.py`)
  - Skill dependency graph
  - Required/optional prerequisites

### 4. Flask App Integration
- **File**: `app.py`
- PostgreSQL database initialized alongside MongoDB (for backward compatibility)
- Graceful fallback if PostgreSQL is unavailable
- All MongoDB references preserved as `receipt_db`

### 5. Environment Configuration
- **File**: `.env`
- Added `DATABASE_URL` variable
- Default: `postgresql://localhost/finlit`

## 🚀 Next Steps to Complete Migration

### Step 1: Install PostgreSQL

#### macOS (using Homebrew):
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows:
Download from https://www.postgresql.org/download/windows/

### Step 2: Create Database

```bash
# Login to PostgreSQL
psql postgres

# Create database
CREATE DATABASE finlit;

# Create user (optional)
CREATE USER finlit_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE finlit TO finlit_user;

# Exit
\q
```

### Step 3: Update Environment Variables

Update `.env` with your database credentials:

```bash
# For local PostgreSQL with default settings
DATABASE_URL=postgresql://localhost/finlit

# OR with custom user/password
DATABASE_URL=postgresql://finlit_user:your_password@localhost:5432/finlit

# For hosted PostgreSQL (e.g., Heroku, AWS RDS, Render)
DATABASE_URL=postgresql://user:password@host:port/database
```

### Step 4: Initialize Flask-Migrate

```bash
cd /Users/madhav/Desktop/finlit/financial_literacy/backend

# Initialize migrations directory (only do this once)
flask db init

# This creates a 'migrations' folder
```

### Step 5: Create Initial Migration

```bash
# Generate migration from models
flask db migrate -m "Initial migration with all models"

# This creates a migration file in migrations/versions/
```

### Step 6: Apply Migration to Database

```bash
# Apply the migration to create tables
flask db upgrade

# You should see output like:
# INFO  [alembic.runtime.migration] Running upgrade  -> abc123, Initial migration
```

### Step 7: Verify Tables Created

```bash
# Connect to PostgreSQL
psql finlit

# List all tables
\dt

# You should see:
# - learners
# - knowledge_components
# - learning_items
# - item_kc_mappings
# - learner_skill_states
# - interactions
# - achievements
# - learner_achievements
# - daily_progress
# - question_templates
# - cultural_contexts
# - kc_prerequisites

# Exit
\q
```

## 🔧 Database Management

### Using Flask-Migrate Commands

```bash
# Create a new migration after model changes
flask db migrate -m "Description of changes"

# Apply pending migrations
flask db upgrade

# Rollback last migration
flask db downgrade

# Show current migration
flask db current

# Show migration history
flask db history
```

### Using Custom Management Script

We've created `manage_db.py` for easier migration management:

```bash
# Initialize migrations
python manage_db.py init

# Create migration
python manage_db.py migrate "Description"

# Apply migrations
python manage_db.py upgrade

# Rollback migration
python manage_db.py downgrade
```

## 📊 Database Schema Overview

```
┌─────────────┐
│  Learners   │
└──────┬──────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌──────────────────┐  ┌─────────────────┐
│ LearnerSkillState│  │  Interactions   │
└────────┬─────────┘  └────────┬────────┘
         │                     │
         │    ┌────────────────┘
         │    │
         ▼    ▼
    ┌──────────────────┐
    │ Knowledge        │◄────┐
    │ Components       │     │
    └────────┬─────────┘     │
             │                │
             ▼                │
    ┌──────────────────┐     │
    │ ItemKCMapping    │     │
    └────────┬─────────┘     │
             │                │
             ▼                │
    ┌──────────────────┐     │
    │ LearningItems    │     │
    └──────────────────┘     │
                              │
    ┌──────────────────┐     │
    │ KCPrerequisite   │─────┘
    └──────────────────┘
```

## 🎮 Gamification Schema

```
┌─────────────┐
│  Learners   │
└──────┬──────┘
       │
       ├──────────────────┬───────────────────┐
       │                  │                   │
       ▼                  ▼                   ▼
┌─────────────────┐ ┌───────────┐  ┌─────────────────┐
│LearnerAchievement│ │Achievement│  │  DailyProgress  │
└─────────────────┘ └───────────┘  └─────────────────┘
```

## 🌍 Cultural Context Schema

```
┌──────────────────┐
│ Knowledge        │
│ Components       │
└────────┬─────────┘
         │
         ├──────────────────┬────────────────────┐
         │                  │                    │
         ▼                  ▼                    ▼
┌──────────────────┐ ┌──────────────┐  ┌────────────────┐
│QuestionTemplate  │ │CulturalContext│  │  LearningItems │
└──────────────────┘ └──────────────┘  └────────────────┘
```

## 🔄 Data Migration Strategy

### Phase 1: ✅ Schema Setup (COMPLETED)
- Database configuration
- Model definitions
- Flask-Migrate integration

### Phase 2: Data Migration (TODO)
- Export data from MongoDB
- Transform to PostgreSQL schema
- Import into PostgreSQL
- Validate data integrity

### Phase 3: Dual Database Period (TODO)
- Run both databases in parallel
- Write to both, read from PostgreSQL
- Monitor for issues

### Phase 4: Full Migration (TODO)
- Switch all reads to PostgreSQL
- Remove MongoDB dependencies
- Clean up legacy code

## 🧪 Testing the Setup

### Test 1: Check Database Connection

```python
from app import app, db

with app.app_context():
    # Test connection
    from sqlalchemy import text
    result = db.session.execute(text("SELECT 1"))
    print("✓ Database connection successful!")
```

### Test 2: Create a Test Learner

```python
from app import app, db
from models import Learner

with app.app_context():
    learner = Learner(
        email="test@example.com",
        display_name="Test User",
        native_language="English",
        financial_experience_level="novice"
    )
    db.session.add(learner)
    db.session.commit()
    print(f"✓ Created learner: {learner.learner_id}")
```

### Test 3: Query Test

```python
from app import app, db
from models import Learner

with app.app_context():
    learner = Learner.query.filter_by(email="test@example.com").first()
    print(f"✓ Found learner: {learner.display_name}")
```

## 📝 Migration Commands Reference

| Command | Description |
|---------|-------------|
| `flask db init` | Initialize migrations directory |
| `flask db migrate -m "msg"` | Create new migration |
| `flask db upgrade` | Apply migrations |
| `flask db downgrade` | Rollback migration |
| `flask db current` | Show current revision |
| `flask db history` | Show migration history |
| `flask db show <revision>` | Show migration details |
| `flask db stamp <revision>` | Set database to revision without running migrations |

## 🛠️ Troubleshooting

### Error: "relation does not exist"
**Solution**: Run `flask db upgrade` to create tables

### Error: "could not connect to server"
**Solution**:
- Check PostgreSQL is running: `brew services list` (macOS)
- Check DATABASE_URL is correct in .env
- Test connection: `psql $DATABASE_URL`

### Error: "password authentication failed"
**Solution**: Update DATABASE_URL with correct credentials

### Error: "database does not exist"
**Solution**: Create database: `createdb finlit`

### Migration conflicts
**Solution**:
```bash
# Remove migrations folder
rm -rf migrations

# Reinitialize
flask db init
flask db migrate -m "Fresh start"
flask db upgrade
```

## 📚 Additional Resources

- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Flask-SQLAlchemy Guide](https://flask-sqlalchemy.palletsprojects.com/)
- [Flask-Migrate Tutorial](https://flask-migrate.readthedocs.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🎯 Current Status

- ✅ Dependencies installed
- ✅ Database configuration created
- ✅ All models defined
- ✅ Flask app integrated
- ✅ Environment variables set
- ⏳ PostgreSQL installation (waiting for you)
- ⏳ Database creation (waiting for you)
- ⏳ Migration initialization (waiting for you)
- ⏳ Migration application (waiting for you)

## 📧 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify PostgreSQL is running
3. Check .env configuration
4. Review migration logs in migrations/versions/
