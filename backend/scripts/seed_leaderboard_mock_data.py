"""
Seed Mock Leaderboard Data

This script generates mock data for the leaderboard system:
- Creates mock learners with varying XP levels
- Generates daily_progress entries for the current week
- Ensures proper league distribution
- Can be run multiple times (idempotent)

Usage:
    python3 scripts/seed_leaderboard_mock_data.py [--count N] [--clear]
"""

import os
import sys
from datetime import datetime, timedelta, date
from random import randint, choice
import uuid

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Database
from bson import ObjectId

# Mock user names for variety
MOCK_NAMES = [
    "Alex Chen", "Sarah Johnson", "Priya Sharma", "Mike Rodriguez", 
    "Emma Wilson", "David Kim", "Lisa Brown", "Raj Patel", 
    "Maria Garcia", "Chris Lee", "Ana Martinez", "Tom Wilson",
    "Nina Patel", "Jake Thompson", "Sophie Anderson", "James Taylor",
    "Olivia Davis", "Noah Martinez", "Ava Garcia", "Liam Brown",
    "Isabella Smith", "Mason Johnson", "Mia Williams", "Ethan Jones",
    "Charlotte Davis", "Lucas Miller", "Amelia Wilson", "Henry Moore"
]

# League XP thresholds (from leaderboard.py)
LEAGUES = [
    {'id': 'bronze', 'min_xp': 0},
    {'id': 'silver', 'min_xp': 500},
    {'id': 'gold', 'min_xp': 1500},
    {'id': 'emerald', 'min_xp': 3000},
    {'id': 'diamond', 'min_xp': 5000},
    {'id': 'master', 'min_xp': 10000},
]


def get_start_of_week():
    """Get the start of current week (Monday midnight UTC)"""
    now = datetime.utcnow()
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    days_since_monday = now.weekday()
    return start_of_day - timedelta(days=days_since_monday)


def get_league_for_xp(total_xp):
    """Determine league based on total XP"""
    current_league = LEAGUES[0]
    for league in LEAGUES:
        if total_xp >= league['min_xp']:
            current_league = league
    return current_league


def create_mock_learner(db, name, target_league_index=None):
    """
    Create a mock learner with appropriate total XP for their league
    
    Args:
        db: Database instance
        name: Display name
        target_league_index: Which league to target (0-5), or None for random
    
    Returns:
        learner_id (str)
    """
    if target_league_index is None:
        target_league_index = randint(0, min(3, len(LEAGUES) - 1))  # Mostly bronze-gold
    
    target_league = LEAGUES[target_league_index]
    next_league = LEAGUES[min(target_league_index + 1, len(LEAGUES) - 1)]
    
    # Set total XP somewhere in the middle of the league range
    min_xp = target_league['min_xp']
    max_xp = next_league['min_xp'] - 1 if next_league['min_xp'] > target_league['min_xp'] else min_xp + 1000
    total_xp = randint(min_xp, max_xp)
    
    # Create learner
    learner_doc = {
        'display_name': name,
        'email': f"{name.lower().replace(' ', '.')}@mock.finlit.com",
        'total_xp': total_xp,
        'streak_count': randint(0, 14),
        'created_at': datetime.utcnow() - timedelta(days=randint(1, 90)),
        'is_mock': True  # Flag for easy cleanup later
    }
    
    result = db.collections.learners.insert_one(learner_doc)
    return str(result.inserted_id)


def generate_weekly_xp(learner_id, week_start, db):
    """
    Generate daily_progress entries for the current week
    
    Args:
        learner_id: Learner ObjectId
        week_start: Start of week datetime
        db: Database instance
    """
    # Generate XP for each day of the week (some days may have 0)
    for day_offset in range(7):
        day_date = week_start + timedelta(days=day_offset)
        
        # Some days have no activity (30% chance)
        if randint(1, 10) <= 3:
            continue
        
        # Generate XP for this day (10-150 XP per day)
        xp_earned = randint(10, 150)
        lessons_completed = randint(0, 3)
        minutes_practiced = randint(5, 45)
        
        # Use upsert to avoid duplicates
        db.collections.daily_progress.update_one(
            {
                'learner_id': ObjectId(learner_id),
                'date': day_date
            },
            {
                '$set': {
                    'xp_earned': xp_earned,
                    'lessons_completed': lessons_completed,
                    'minutes_practiced': minutes_practiced,
                    'goal_met': minutes_practiced >= 20,
                    'created_at': datetime.utcnow()
                }
            },
            upsert=True
        )


def seed_mock_data(count=25, clear_existing=False):
    """
    Seed mock leaderboard data
    
    Args:
        count: Number of mock learners to create
        clear_existing: Whether to clear existing mock data first
    """
    db = Database()
    
    if not db.is_connected:
        print("❌ Cannot connect to database. Check your MONGO_URI in .env")
        return
    
    print(f"📊 Seeding {count} mock learners for leaderboard...")
    
    # Clear existing mock data if requested
    if clear_existing:
        print("🗑️  Clearing existing mock data...")
        db.collections.learners.delete_many({'is_mock': True})
        # Note: We don't delete daily_progress as it might be shared with real users
        # Instead, we'll just regenerate for mock learners
    
    week_start = get_start_of_week()
    
    # Create learners distributed across leagues
    # Ensure we have at least a few in each league for testing
    league_distribution = {
        0: max(5, count // 3),  # Bronze: 33%
        1: max(4, count // 4),  # Silver: 25%
        2: max(3, count // 5),  # Gold: 20%
        3: max(2, count // 6),  # Emerald: 17%
        4: max(1, count // 10), # Diamond: 10%
        5: max(1, count // 20), # Master: 5%
    }
    
    created_count = 0
    used_names = set()
    
    for league_idx, num_learners in league_distribution.items():
        if created_count >= count:
            break
        
        for _ in range(min(num_learners, count - created_count)):
            # Pick a unique name
            available_names = [n for n in MOCK_NAMES if n not in used_names]
            if not available_names:
                # If we run out, add a number
                name = f"User {created_count + 1}"
            else:
                name = choice(available_names)
                used_names.add(name)
            
            learner_id = create_mock_learner(db, name, target_league_index=league_idx)
            generate_weekly_xp(learner_id, week_start, db)
            created_count += 1
    
    # Fill remaining slots randomly
    while created_count < count:
        available_names = [n for n in MOCK_NAMES if n not in used_names]
        if not available_names:
            name = f"User {created_count + 1}"
        else:
            name = choice(available_names)
            used_names.add(name)
        
        learner_id = create_mock_learner(db, name, target_league_index=None)
        generate_weekly_xp(learner_id, week_start, db)
        created_count += 1
    
    print(f"✅ Created {created_count} mock learners")
    print(f"✅ Generated weekly progress for current week (started {week_start.strftime('%Y-%m-%d')})")
    
    # Show distribution
    print("\n📈 League Distribution:")
    for league in LEAGUES:
        count_in_league = db.collections.learners.count_documents({
            'is_mock': True,
            'total_xp': {'$gte': league['min_xp']}
        })
        next_league = next((l for l in LEAGUES if l['min_xp'] > league['min_xp']), None)
        if next_league:
            count_in_league = db.collections.learners.count_documents({
                'is_mock': True,
                'total_xp': {'$gte': league['min_xp'], '$lt': next_league['min_xp']}
            })
        else:
            count_in_league = db.collections.learners.count_documents({
                'is_mock': True,
                'total_xp': {'$gte': league['min_xp']}
            })
        print(f"  {league['id'].capitalize()}: {count_in_league} learners")
    
    print("\n💡 Tip: Use --clear to regenerate mock data")


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Seed mock leaderboard data')
    parser.add_argument('--count', type=int, default=25, help='Number of mock learners to create (default: 25)')
    parser.add_argument('--clear', action='store_true', help='Clear existing mock data first')
    
    args = parser.parse_args()
    
    seed_mock_data(count=args.count, clear_existing=args.clear)

