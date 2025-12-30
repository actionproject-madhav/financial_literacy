"""
Cleanup Duplicate Test Learners

This script removes duplicate "Test Learner" entries, keeping only one.
It also ensures all learners have proper weekly XP for the leaderboard.

Usage:
    python3 scripts/cleanup_duplicate_learners.py [--dry-run]
"""

import os
import sys
from datetime import datetime, timedelta
from collections import defaultdict

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Database
from bson import ObjectId


def get_start_of_week():
    """Get the start of current week (Monday midnight UTC)"""
    now = datetime.utcnow()
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    days_since_monday = now.weekday()
    return start_of_day - timedelta(days=days_since_monday)


def cleanup_duplicates(dry_run=True):
    """Clean up duplicate Test Learner entries"""
    db = Database()
    
    if not db.is_connected:
        print("❌ Cannot connect to database. Check your MONGO_URI in .env")
        return
    
    print("🔍 Finding duplicate learners...")
    
    # Find all learners with duplicate display names
    pipeline = [
        {'$group': {
            '_id': '$display_name',
            'count': {'$sum': 1},
            'ids': {'$push': '$_id'}
        }},
        {'$match': {'count': {'$gt': 1}}}
    ]
    
    duplicates = list(db.collections.learners.aggregate(pipeline))
    
    if not duplicates:
        print("✅ No duplicate display names found")
        return
    
    total_removed = 0
    
    for dup in duplicates:
        display_name = dup['_id']
        count = dup['count']
        ids = dup['ids']
        
        if display_name == 'Test Learner':
            print(f"\n📋 Found {count} 'Test Learner' entries")
            
            # Get all Test Learner entries with their XP
            learners = list(db.collections.learners.find({
                '_id': {'$in': ids}
            }))
            
            # Sort by total_xp (keep the one with highest XP, or most recent)
            learners.sort(key=lambda x: (x.get('total_xp', 0), x.get('created_at', datetime.min)), reverse=True)
            
            # Keep the first one, remove the rest
            keep_id = learners[0]['_id']
            remove_ids = [l['_id'] for l in learners[1:]]
            
            print(f"  ✓ Keeping: {keep_id} (XP: {learners[0].get('total_xp', 0)})")
            print(f"  🗑️  Removing {len(remove_ids)} duplicates")
            
            if not dry_run:
                # Remove duplicate learners
                result = db.collections.learners.delete_many({
                    '_id': {'$in': remove_ids}
                })
                total_removed += result.deleted_count
                
                # Also remove their daily_progress entries
                db.collections.daily_progress.delete_many({
                    'learner_id': {'$in': remove_ids}
                })
                print(f"  ✅ Removed {result.deleted_count} duplicate learners")
            else:
                print(f"  [DRY RUN] Would remove {len(remove_ids)} learners")
        else:
            print(f"\n⚠️  Found {count} duplicates for '{display_name}' (not cleaning)")
    
    if dry_run:
        print("\n💡 Run without --dry-run to actually remove duplicates")
    else:
        print(f"\n✅ Cleanup complete! Removed {total_removed} duplicate learners")


def ensure_weekly_xp_for_all():
    """Ensure all learners have at least some weekly XP for better leaderboard display"""
    db = Database()
    
    if not db.is_connected:
        print("❌ Cannot connect to database")
        return
    
    print("\n📊 Ensuring all learners have weekly XP...")
    
    week_start = get_start_of_week()
    
    # Get all learners
    all_learners = list(db.collections.learners.find({}))
    
    updated_count = 0
    for learner in all_learners:
        learner_id = learner['_id']
        
        # Check if they have any weekly XP
        pipeline = [
            {'$match': {
                'learner_id': learner_id,
                'date': {'$gte': week_start}
            }},
            {'$group': {'_id': None, 'total': {'$sum': '$xp_earned'}}}
        ]
        result = list(db.collections.daily_progress.aggregate(pipeline))
        weekly_xp = result[0]['total'] if result and result[0].get('total') else 0
        
        # If they have 0 weekly XP and are not mock users, give them a small amount
        if weekly_xp == 0 and not learner.get('is_mock', False):
            # Add a small amount of XP for today
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            from random import randint
            
            xp_earned = randint(5, 50)  # Small amount
            
            db.collections.daily_progress.update_one(
                {
                    'learner_id': learner_id,
                    'date': today
                },
                {
                    '$set': {
                        'xp_earned': xp_earned,
                        'lessons_completed': 1,
                        'minutes_practiced': randint(5, 20),
                        'goal_met': False,
                        'created_at': datetime.utcnow()
                    }
                },
                upsert=True
            )
            updated_count += 1
    
    print(f"✅ Updated {updated_count} learners with weekly XP")


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Cleanup duplicate learners')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be removed without actually removing')
    parser.add_argument('--ensure-xp', action='store_true', help='Ensure all learners have weekly XP')
    
    args = parser.parse_args()
    
    cleanup_duplicates(dry_run=args.dry_run)
    
    if args.ensure_xp:
        ensure_weekly_xp_for_all()

