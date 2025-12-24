# Data Migration Guide: MongoDB → PostgreSQL

## 📚 Overview

This guide covers the complete process of migrating data from MongoDB to PostgreSQL for the FinLit learning platform.

The migration system includes:
- **Automated data mapping** from MongoDB documents to PostgreSQL models
- **Batch processing** for efficient large-scale migrations
- **Validation tools** to verify data integrity
- **Rollback capabilities** to undo migrations
- **Comprehensive logging** for audit trails

## 📁 Migration Scripts

All migration scripts are located in `/migrations_scripts/`:

| Script | Purpose |
|--------|---------|
| `migration_utils.py` | Core utilities, transformers, validators |
| `data_mapper.py` | MongoDB→PostgreSQL data mapping logic |
| `migrate_data.py` | Main migration orchestrator |
| `validate_migration.py` | Post-migration validation |
| `rollback_migration.py` | Rollback/cleanup tool |

## 🚀 Quick Start

### 1. Prerequisites

Ensure you have:
- ✅ PostgreSQL installed and running
- ✅ DATABASE_URL configured in `.env`
- ✅ MongoDB connection working (MONGO_URI in `.env`)
- ✅ Database tables created (`flask db upgrade`)

### 2. Test Migration (Dry Run)

```bash
cd /Users/madhav/Desktop/finlit/financial_literacy/backend/migrations_scripts

# List available collections
python migrate_data.py --list

# Test migration without writing data
python migrate_data.py --all --dry-run
```

### 3. Run Actual Migration

```bash
# Migrate all collections
python migrate_data.py --all

# OR migrate specific collection
python migrate_data.py --collection learners
```

### 4. Validate Migration

```bash
# Validate all collections
python validate_migration.py --all

# Validate specific collection
python validate_migration.py --collection learners --sample 50
```

### 5. Rollback (if needed)

```bash
# Show what would be deleted
python rollback_migration.py --all --dry-run

# Actually rollback (requires confirmation)
python rollback_migration.py --all --confirm
```

## 📊 Supported Collections

The migration supports the following MongoDB collections:

1. **learners** → `Learner` model
   - User profiles, preferences, gamification data

2. **knowledge_components** → `KnowledgeComponent` model
   - Skills and concepts with hierarchical structure

3. **learning_items** → `LearningItem` model
   - Questions, videos, interactive content

4. **item_kc_mappings** → `ItemKCMapping` model
   - Many-to-many relationships between items and skills

5. **learner_skill_states** → `LearnerSkillState` model
   - Per-user mastery tracking with spaced repetition

6. **interactions** → `Interaction` model
   - Student responses and performance analytics

7. **achievements** → `Achievement` model
   - Available badges and achievements

8. **learner_achievements** → `LearnerAchievement` model
   - User achievement progress

9. **daily_progress** → `DailyProgress` model
   - Daily goal tracking and streaks

## 🔄 Data Mapping Details

### Learner Mapping

**MongoDB Structure:**
```json
{
  "_id": ObjectId("..."),
  "email": "user@example.com",
  "display_name": "John Doe",
  "profile": {
    "native_language": "Spanish",
    "english_proficiency": "intermediate",
    "immigration_status": "H1B",
    "country_of_origin": "Mexico",
    "visa_type": "H1B",
    "has_ssn": true,
    "sends_remittances": true,
    "financial_goals": ["save", "invest"]
  },
  "gamification": {
    "total_xp": 1500,
    "streak_count": 7,
    "streak_last_date": ISODate("2025-01-15"),
    "daily_goal_minutes": 15
  },
  "financial_experience_level": "novice",
  "timezone": "America/New_York",
  "created_at": ISODate("2025-01-01"),
  "last_active_at": ISODate("2025-01-15")
}
```

**PostgreSQL Structure:**
```sql
learner_id              UUID PRIMARY KEY
email                   VARCHAR(255) NOT NULL UNIQUE
display_name            VARCHAR(255)
native_language         VARCHAR(50)
english_proficiency     VARCHAR(50) DEFAULT 'intermediate'
immigration_status      VARCHAR(50)
financial_experience_level VARCHAR(50) DEFAULT 'novice'
daily_goal_minutes      INTEGER DEFAULT 10
timezone                VARCHAR(50) DEFAULT 'America/New_York'
streak_count            INTEGER DEFAULT 0
streak_last_date        DATE
total_xp                INTEGER DEFAULT 0
country_of_origin       VARCHAR(100)
visa_type               VARCHAR(50)
has_ssn                 BOOLEAN
sends_remittances       BOOLEAN
financial_goals         JSON
created_at              TIMESTAMP DEFAULT NOW()
last_active_at          TIMESTAMP
```

**Key Transformations:**
- MongoDB ObjectId → Deterministic UUID (same ObjectId always produces same UUID)
- Nested `profile` object → Flattened columns
- Nested `gamification` object → Flattened columns
- ISODate → PostgreSQL TIMESTAMP

### Knowledge Component Mapping

**MongoDB → PostgreSQL:**
- Hierarchical relationships preserved via `parent_kc_id`
- Self-referential foreign key for tree structure
- Slug field for human-readable URLs

### Learning Item Mapping

**MongoDB → PostgreSQL:**
- `content` field stores JSON with questions, choices, explanations
- IRT parameters: `difficulty`, `discrimination`
- Cultural variants stored in `content` JSON
- Media URLs for videos/images

### Interaction Mapping

**MongoDB → PostgreSQL:**
- Full response logging for analytics
- Spaced repetition parameters tracked
- Session IDs for grouping
- Indexes on learner_id + created_at for fast queries

## ⚙️ Command Reference

### migrate_data.py

```bash
# Show help
python migrate_data.py --help

# List available collections
python migrate_data.py --list

# Dry run (no data written)
python migrate_data.py --all --dry-run

# Migrate all collections
python migrate_data.py --all

# Migrate specific collection
python migrate_data.py --collection learners

# Custom batch size (default 100)
python migrate_data.py --all --batch-size 500
```

### validate_migration.py

```bash
# Validate all collections
python validate_migration.py --all

# Validate specific collection
python validate_migration.py --collection learners

# Custom sample size for data validation
python validate_migration.py --all --sample 100

# Only validate counts (skip sample data)
python validate_migration.py --all --count-only
```

### rollback_migration.py

```bash
# Show current table counts
python rollback_migration.py --counts

# Dry run rollback (see what would be deleted)
python rollback_migration.py --all --dry-run

# Clear specific table
python rollback_migration.py --collection learners --dry-run
python rollback_migration.py --collection learners --confirm

# Clear all tables (requires double confirmation)
python rollback_migration.py --all --confirm
```

## 📈 Migration Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PRE-MIGRATION CHECKS                                     │
├─────────────────────────────────────────────────────────────┤
│ ✓ Verify PostgreSQL connection                             │
│ ✓ Verify MongoDB connection                                │
│ ✓ Check database tables exist (flask db upgrade)           │
│ ✓ List available collections                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. DRY RUN (Recommended)                                    │
├─────────────────────────────────────────────────────────────┤
│ $ python migrate_data.py --all --dry-run                    │
│                                                              │
│ → Validates data mapping without writing                   │
│ → Shows statistics and potential errors                    │
│ → Review migration.log for details                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. BACKUP (Critical!)                                       │
├─────────────────────────────────────────────────────────────┤
│ MongoDB: mongodump --uri=$MONGO_URI                        │
│ PostgreSQL: pg_dump -U user -d finlit > backup.sql         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ACTUAL MIGRATION                                         │
├─────────────────────────────────────────────────────────────┤
│ $ python migrate_data.py --all                              │
│                                                              │
│ → Reads MongoDB collections                                │
│ → Maps to PostgreSQL models                                │
│ → Batch inserts (100 records/batch)                        │
│ → Progress bar shows status                                │
│ → Detailed logging to migration.log                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. VALIDATION                                               │
├─────────────────────────────────────────────────────────────┤
│ $ python validate_migration.py --all --sample 100           │
│                                                              │
│ ✓ Count validation (MongoDB vs PostgreSQL)                 │
│ ✓ Sample data validation (record existence)                │
│ ✓ Integrity checks (foreign keys, constraints)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. POST-MIGRATION                                           │
├─────────────────────────────────────────────────────────────┤
│ ✓ Review validation results                                │
│ ✓ Check migration.log for errors                           │
│ ✓ Test application with PostgreSQL                         │
│ ✓ Run automated tests                                      │
│ ✓ Monitor application performance                          │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 Validation Reports

The validation script produces detailed reports:

### Count Validation
```
✅ learners                   | MongoDB:    150 | PostgreSQL:    150 | Diff:      0
✅ knowledge_components       | MongoDB:     45 | PostgreSQL:     45 | Diff:      0
✅ learning_items            | MongoDB:    320 | PostgreSQL:    320 | Diff:      0
❌ interactions              | MongoDB:   5000 | PostgreSQL:   4995 | Diff:      5
```

### Sample Data Validation
```
✅ learners                   |  10/10 passed | 100.0%
✅ knowledge_components       |  10/10 passed | 100.0%
✅ learning_items            |  10/10 passed | 100.0%
❌ interactions              |   9/10 passed |  90.0%
```

## 🐛 Troubleshooting

### Issue: "No collections found to migrate"

**Cause:** MongoDB collections don't exist or have different names

**Solution:**
```bash
# List MongoDB collections
python migrate_data.py --list

# Check MongoDB connection
python -c "from pymongo import MongoClient; import os; from dotenv import load_dotenv; load_dotenv(); client = MongoClient(os.getenv('MONGO_URI')); print(client.list_database_names())"
```

### Issue: "IntegrityError: duplicate key value"

**Cause:** Data already exists in PostgreSQL

**Solution:**
```bash
# Clear table first
python rollback_migration.py --collection learners --confirm

# Then re-migrate
python migrate_data.py --collection learners
```

### Issue: "Connection refused to PostgreSQL"

**Cause:** PostgreSQL not running or DATABASE_URL incorrect

**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql $DATABASE_URL

# Verify .env
cat .env | grep DATABASE_URL
```

### Issue: "Foreign key violation"

**Cause:** Dependencies migrated in wrong order

**Solution:** The migration script automatically handles order. If this occurs:
```bash
# Clear all tables and remigrate
python rollback_migration.py --all --confirm
python migrate_data.py --all
```

### Issue: "Migration very slow"

**Cause:** Large dataset, network latency, or small batch size

**Solution:**
```bash
# Increase batch size
python migrate_data.py --all --batch-size 1000

# For very large datasets, migrate collections individually
python migrate_data.py --collection learners --batch-size 1000
```

## 📊 Performance Tips

### Optimize for Large Datasets

1. **Increase batch size:**
   ```bash
   python migrate_data.py --all --batch-size 1000
   ```

2. **Migrate in stages:**
   ```bash
   # Migrate core tables first
   python migrate_data.py --collection learners
   python migrate_data.py --collection knowledge_components

   # Then dependent tables
   python migrate_data.py --collection interactions
   ```

3. **Disable PostgreSQL constraints temporarily:**
   ```sql
   ALTER TABLE interactions DROP CONSTRAINT IF EXISTS fk_learner;
   -- Run migration
   ALTER TABLE interactions ADD CONSTRAINT fk_learner FOREIGN KEY (learner_id) REFERENCES learners(learner_id);
   ```

4. **Use PostgreSQL connection pooling:**
   Update `config/database.py`:
   ```python
   app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
       'pool_size': 20,
       'max_overflow': 40
   }
   ```

## 🔒 Data Integrity

### UUID Mapping

ObjectIds are converted to UUIDs **deterministically**:
- Same ObjectId always produces same UUID
- Uses UUID v5 (namespace + name)
- Ensures referential integrity across tables

Example:
```python
ObjectId("507f1f77bcf86cd799439011")
    ↓
UUID("e4db2e7a-5c7c-5f9a-8e3d-2f1a3b4c5d6e")
```

### Foreign Key Relationships

```
Learner (learner_id)
    ↓
    ├── LearnerSkillState (learner_id, kc_id)
    ├── Interaction (learner_id, item_id, kc_id)
    ├── LearnerAchievement (learner_id, achievement_id)
    └── DailyProgress (learner_id, date)

KnowledgeComponent (kc_id)
    ↓
    ├── KnowledgeComponent (parent_kc_id) [self-reference]
    ├── ItemKCMapping (item_id, kc_id)
    └── LearnerSkillState (learner_id, kc_id)

LearningItem (item_id)
    ↓
    ├── ItemKCMapping (item_id, kc_id)
    └── Interaction (learner_id, item_id, kc_id)
```

## 📝 Logging

All migration activities are logged to `migration.log`:

```
2025-01-15 10:30:00 - INFO - MIGRATION STARTED
2025-01-15 10:30:01 - INFO - Migrating collection: learners
2025-01-15 10:30:02 - INFO - Found 150 documents in MongoDB
2025-01-15 10:30:05 - INFO - Progress: [████████████████████] 100.0% (150/150)
2025-01-15 10:30:05 - INFO - ✅ Counts match!
```

View logs in real-time:
```bash
tail -f migration.log
```

## 🎯 Migration Checklist

- [ ] PostgreSQL installed and running
- [ ] DATABASE_URL configured in `.env`
- [ ] MongoDB connection working
- [ ] Database tables created (`flask db upgrade`)
- [ ] Backup MongoDB data (`mongodump`)
- [ ] Backup PostgreSQL data (`pg_dump`)
- [ ] Run dry-run migration
- [ ] Review dry-run logs
- [ ] Run actual migration
- [ ] Validate migration results
- [ ] Test application functionality
- [ ] Monitor for errors
- [ ] Keep backups for 30 days

## 🚨 Rollback Procedure

If migration fails or data is incorrect:

1. **Stop application**
2. **Rollback PostgreSQL:**
   ```bash
   python rollback_migration.py --all --confirm
   ```
3. **Restore from backup (if needed):**
   ```bash
   psql -U user -d finlit < backup.sql
   ```
4. **Fix migration issues**
5. **Re-run migration**

## 📞 Support

For migration issues:
1. Check `migration.log` for detailed errors
2. Review this guide's troubleshooting section
3. Validate environment variables in `.env`
4. Test connections to both databases

## 🎉 Success Criteria

Migration is successful when:
- ✅ All validation checks pass
- ✅ Record counts match between MongoDB and PostgreSQL
- ✅ Sample data validation shows 100% success rate
- ✅ Application runs correctly with PostgreSQL
- ✅ No errors in migration.log
- ✅ Foreign key relationships intact
- ✅ Data types correctly mapped
