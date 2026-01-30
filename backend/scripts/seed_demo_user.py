#!/usr/bin/env python3
"""
Seed Demo User - Initialize the guest user account with data.

This script creates or updates the learner with ID 000000000000000000000000
to ensure guest users have a functional and rich experience.
"""

import sys
import os
from datetime import datetime, timedelta, date
from bson import ObjectId

# Add parent directory to path to import database modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Database

DEMO_USER_ID = "000000000000000000000000"

def seed_demo_user():
    print("="*80)
    print(f"SEEDING DEMO USER ({DEMO_USER_ID})")
    print("="*80)

    db = Database()
    if not db.is_connected:
        print("\n❌ Cannot connect to database. Check your MONGO_URI in .env")
        return False

    # 1. Create/Update Learner Profile
    learner_data = {
        "display_name": "Demo User",
        "email": "demo@test.com",
        "native_language": "English",
        "english_proficiency": "advanced",
        "country_of_origin": "US",
        "immigration_status": "Citizen",
        "visa_type": "Other",
        "has_ssn": True,
        "sends_remittances": False,
        "financial_goals": ["emergency_fund", "investing"],
        "financial_experience_level": "intermediate",
        "daily_goal_minutes": 15,
        "onboarding_completed": True,
        "total_xp": 1250,
        "streak_count": 7,
        "gems": 500,
        "hearts": 5,
        "created_at": datetime.utcnow() - timedelta(days=30),
        "updated_at": datetime.utcnow()
    }

    db.collections.learners.update_one(
        {"_id": ObjectId(DEMO_USER_ID)},
        {"$set": learner_data},
        upsert=True
    )
    print(f"✓ Learner profile initialized")

    # 2. Initialize Skill States
    # We'll make some skills available and some mastered
    skills = list(db.collections.knowledge_components.find().limit(10))
    if not skills:
        print("⚠️ No skills found in database. Run seed_skills.py first.")
    else:
        for i, skill in enumerate(skills):
            status = "mastered" if i < 3 else "available"
            p_mastery = 1.0 if status == "mastered" else 0.1
            
            db.collections.learner_skill_states.update_one(
                {
                    "learner_id": ObjectId(DEMO_USER_ID),
                    "kc_id": skill["_id"]
                },
                {
                    "$set": {
                        "p_mastery": p_mastery,
                        "status": status,
                        "total_attempts": 5 if status == "mastered" else 0,
                        "correct_count": 5 if status == "mastered" else 0,
                        "updated_at": datetime.utcnow()
                    }
                },
                upsert=True
            )
        print(f"✓ {len(skills)} skill states initialized")

    # 3. Initialize Daily Progress
    today = date.today()
    for i in range(7):
        day_date = datetime.combine(today - timedelta(days=i), datetime.min.time())
        xp = 50 + (i * 10)
        db.collections.daily_progress.update_one(
            {
                "learner_id": ObjectId(DEMO_USER_ID),
                "date": day_date
            },
            {
                "$set": {
                    "xp_earned": xp,
                    "lessons_completed": 2,
                    "minutes_practiced": 20,
                    "goal_met": True,
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )
    print("✓ 7 days of progress history seeded")

    # 4. Add some following data so the social side isn't empty
    # Find a few other users to follow
    others = list(db.collections.learners.find({"_id": {"$ne": ObjectId(DEMO_USER_ID)}}).limit(3))
    for other in others:
        db.collections.follows.update_one(
            {
                "follower_id": ObjectId(DEMO_USER_ID),
                "following_id": other["_id"]
            },
            {
                "$set": {"created_at": datetime.utcnow()}
            },
            upsert=True
        )
    print(f"✓ Following {len(others)} other users")

    print("\n✅ Demo user seeded successfully!\n")
    return True

if __name__ == "__main__":
    seed_demo_user()
