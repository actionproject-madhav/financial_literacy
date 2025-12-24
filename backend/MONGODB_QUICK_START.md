# MongoDB Quick Start Guide - FinLit Learning Platform

## ✅ What's Been Set Up

All MongoDB collections for the FinLit learning platform are now ready to use! Here's what you have:

### 📁 Files Created

```
backend/
├── mongo_collections.py          (MongoDB collections manager with helper methods)
├── database.py                    (Updated to include FinLit collections)
├── seed_data.py                   (Sample data seeding script)
├── MONGODB_SCHEMA.md              (Complete schema documentation)
└── MONGODB_QUICK_START.md         (This file)
```

### 🗄️ Collections Available

12 MongoDB collections ready to use:

1. **learners** - User profiles
2. **knowledge_components** - Skills & concepts
3. **learning_items** - Questions, videos, content
4. **item_kc_mappings** - Item-skill relationships
5. **learner_skill_states** - Mastery tracking
6. **interactions** - Response logging
7. **achievements** - Available badges
8. **learner_achievements** - User achievements
9. **daily_progress** - Daily goals
10. **question_templates** - Dynamic questions
11. **cultural_contexts** - Cultural personalization
12. **kc_prerequisites** - Skill dependencies

## 🚀 Quick Start (3 Steps)

### Step 1: Create Indexes

Run this once to create all database indexes:

```bash
cd /Users/madhav/Desktop/finlit/financial_literacy/backend

python -c "from database import Database; db = Database(); db.initialize_indexes()"
```

Expected output:
```
Creating MongoDB indexes for FinLit collections...
✅ All indexes created successfully!
```

### Step 2: Seed Sample Data

Populate the database with sample learners, questions, and progress:

```bash
python seed_data.py
```

Expected output:
```
================================================================================
SEEDING FINLIT MONGODB DATABASE
================================================================================

📊 Creating indexes...
👤 Creating sample learners...
  ✓ Created learner: Maria Garcia
  ✓ Created learner: Raj Patel
📚 Creating knowledge components...
  ✓ Created KC: Credit Score Basics
  ✓ Created KC: Building Credit
  ✓ Created KC: Banking Basics
...
✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!
```

### Step 3: Use in Your Code

```python
from database import Database

# Initialize database
db = Database()

# Use collections
collections = db.collections

# Create a learner
learner_id = collections.create_learner(
    email="newuser@example.com",
    display_name="New User",
    native_language="Spanish"
)

# Get learner
learner = collections.get_learner_by_email("newuser@example.com")

# Record an interaction
collections.create_interaction(
    learner_id=learner_id,
    item_id=item_id,
    kc_id=kc_id,
    session_id="session-123",
    is_correct=True,
    response_time_ms=5000
)

# Update daily progress
from datetime import date
collections.update_daily_progress(
    learner_id=learner_id,
    date_obj=date.today(),
    xp_earned=50,
    lessons_completed=1,
    minutes_practiced=15
)
```

## 📖 Common Operations

### Creating a Learner
```python
learner_id = db.collections.create_learner(
    email="user@example.com",
    display_name="John Doe",
    native_language="Hindi",
    english_proficiency="intermediate",
    immigration_status="H1B",
    country_of_origin="India",
    financial_experience_level="novice",
    daily_goal_minutes=20
)
```

### Creating a Knowledge Component
```python
kc_id = db.collections.create_knowledge_component(
    slug="budgeting-basics",
    name="Budgeting Fundamentals",
    description="Learn how to create and maintain a budget",
    domain="budgeting",
    difficulty_tier=1,
    estimated_minutes=15
)
```

### Creating a Learning Item (Question)
```python
item_id = db.collections.create_learning_item(
    item_type="multiple_choice",
    content={
        "stem": "What percentage of income should go to savings?",
        "choices": ["5%", "10%", "20%", "50%"],
        "correct_answer": 2,
        "explanation": "Financial experts recommend saving 20% of your income..."
    },
    difficulty=0.4
)
```

### Recording an Interaction
```python
import uuid

db.collections.create_interaction(
    learner_id=learner_id,
    item_id=item_id,
    kc_id=kc_id,
    session_id=str(uuid.uuid4()),
    is_correct=True,
    response_value={"selected_choice": 2},
    response_time_ms=7500,
    p_mastery_before=0.5,
    selection_method="adaptive"
)
```

### Getting Skills for Review
```python
# Get skills due for spaced repetition review
skills_to_review = db.collections.get_skills_for_review(learner_id)

for skill in skills_to_review:
    print(f"Review: {skill['kc_id']} - Next review was {skill['next_review_at']}")
```

### Award Achievement
```python
achievement_id = db.collections.create_achievement(
    slug="perfect-score",
    name="Perfect Score",
    description="Get 100% on a lesson",
    xp_reward=100,
    criteria={"type": "perfect_lesson"}
)

# Award to learner
db.collections.award_achievement(learner_id, achievement_id)
```

### Update Streak
```python
# Increment streak
db.collections.update_streak(learner_id, increment=True)

# Break streak
db.collections.update_streak(learner_id, increment=False)

# Add XP
db.collections.add_xp(learner_id, 50)
```

## 📊 Sample Data Included

After running `seed_data.py`, you'll have:

### Sample Learners:
- **maria.garcia@example.com** - H1B visa holder from Mexico, beginner
- **raj.patel@example.com** - Green card holder from India, intermediate, 7-day streak

### Sample Knowledge Components:
- Credit Score Basics
- Building Credit (child of Credit Basics)
- Banking Fundamentals

### Sample Learning Items:
- 3 multiple-choice questions about credit and banking

### Sample Data:
- 2 interactions for Raj
- 7 days of progress for Raj (450 XP, 7-day streak)
- 2 achievements (First Steps, Week Warrior)
- 2 cultural contexts (Mexico, India)

## 🔍 Querying Data

### Find All Learners
```python
learners = list(db.collections.learners.find())
for learner in learners:
    print(f"{learner['display_name']}: {learner['total_xp']} XP")
```

### Get Learner's Achievements
```python
achievements = db.collections.get_learner_achievements(learner_id)
for achievement in achievements:
    print(f"🏆 {achievement['name']} - {achievement['xp_reward']} XP")
```

### Get Items for a Knowledge Component
```python
items = db.collections.get_items_for_kc(kc_id)
print(f"Found {len(items)} items for this KC")
```

### Get Recent Interactions
```python
interactions = db.collections.get_learner_interactions(learner_id, limit=10)
for interaction in interactions:
    status = "✓" if interaction['is_correct'] else "✗"
    print(f"{status} {interaction['created_at']}")
```

### Get Daily Progress
```python
progress = db.collections.get_daily_progress(learner_id, days=7)
for day in progress:
    status = "🎯" if day['goal_met'] else "  "
    print(f"{status} {day['date']}: {day['minutes_practiced']} min, {day['xp_earned']} XP")
```

## 🔧 MongoDB Compass

To visualize your data, use MongoDB Compass:

1. Install: https://www.mongodb.com/products/compass
2. Connect using your MONGO_URI from `.env`
3. Browse collections and documents visually

## 📚 Documentation

- **[MONGODB_SCHEMA.md](MONGODB_SCHEMA.md)** - Complete schema reference
- **[mongo_collections.py](mongo_collections.py)** - All helper methods
- **[database.py](database.py)** - Database connection

## 🎯 Next Steps

1. ✅ Run `python seed_data.py` to populate database
2. ✅ Test queries in Python shell or Compass
3. ✅ Build API endpoints using these collections
4. ✅ Implement adaptive learning algorithms
5. ✅ Add more learning items and knowledge components

## 💡 Tips

1. **Always use helper methods** in `mongo_collections.py` instead of raw PyMongo
2. **Check `is_connected`** before database operations:
   ```python
   if db.is_connected:
       # Safe to use db.collections
   ```
3. **Use ObjectIds** for references between collections
4. **Store dates in UTC** using `datetime.utcnow()`
5. **Run indexes creation** once after deployment

## ⚡ Performance

Indexes are already created for:
- Email lookups (learners)
- KC slug lookups
- Learner-KC state queries
- Interaction queries by learner/date
- All foreign key relationships

## 🆘 Troubleshooting

### "ModuleNotFoundError: No module named 'mongo_collections'"
```bash
# Make sure you're in the right directory
cd /Users/madhav/Desktop/finlit/financial_literacy/backend
python seed_data.py
```

### "Cannot connect to database"
```bash
# Check your .env file has MONGO_URI
cat .env | grep MONGO_URI

# Test connection
python -c "from database import Database; db = Database(); print(db.is_connected)"
```

### "Duplicate key error"
The indexes are enforcing uniqueness. Common causes:
- Trying to create learner with existing email
- Running seed_data.py twice (delete old data first)

```python
# Clear all data
db.collections.learners.delete_many({})
db.collections.knowledge_components.delete_many({})
# ... etc
```

## 🎉 You're Ready!

Your MongoDB database is fully set up with:
- ✅ 12 collections
- ✅ Indexes for performance
- ✅ Helper methods for all operations
- ✅ Sample data to get started
- ✅ Complete documentation

Start building your adaptive learning platform! 🚀
