"""
Delete Mock Users from Production

This script removes all mock/test users from the database.
Run this before going to production to ensure only real users appear.

Usage:
    python3 scripts/delete_mock_users.py [--dry-run]
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Database
from bson import ObjectId


def delete_mock_users(dry_run=False):
    """
    Delete all mock users and their associated data

    Args:
        dry_run: If True, only show what would be deleted without actually deleting
    """
    db = Database()

    if not db.is_connected:
        print("❌ Cannot connect to database. Check your MONGO_URI in .env")
        return

    # Find all mock learners
    mock_learners = list(db.collections.learners.find({'is_mock': True}))
    mock_learner_ids = [l['_id'] for l in mock_learners]

    print(f"Found {len(mock_learners)} mock users to delete:")
    for learner in mock_learners[:10]:  # Show first 10
        print(f"  - {learner.get('display_name', 'Unknown')} ({learner.get('email', 'no email')})")
    if len(mock_learners) > 10:
        print(f"  ... and {len(mock_learners) - 10} more")

    if dry_run:
        print("\n🔍 DRY RUN - No changes made")

        # Count related data
        daily_progress_count = db.collections.daily_progress.count_documents({
            'learner_id': {'$in': mock_learner_ids}
        })
        print(f"Would delete {daily_progress_count} daily_progress records")

        # Check for other related collections
        if hasattr(db.collections, 'learner_skill_states'):
            skill_states_count = db.collections.learner_skill_states.count_documents({
                'learner_id': {'$in': mock_learner_ids}
            })
            print(f"Would delete {skill_states_count} skill_state records")

        if hasattr(db.collections, 'interactions'):
            interactions_count = db.collections.interactions.count_documents({
                'learner_id': {'$in': mock_learner_ids}
            })
            print(f"Would delete {interactions_count} interaction records")

        return

    # Actually delete
    print("\n🗑️  Deleting mock data...")

    # Delete daily_progress for mock users
    result = db.collections.daily_progress.delete_many({
        'learner_id': {'$in': mock_learner_ids}
    })
    print(f"  Deleted {result.deleted_count} daily_progress records")

    # Delete skill states for mock users
    if hasattr(db.collections, 'learner_skill_states'):
        result = db.collections.learner_skill_states.delete_many({
            'learner_id': {'$in': mock_learner_ids}
        })
        print(f"  Deleted {result.deleted_count} skill_state records")

    # Delete interactions for mock users
    if hasattr(db.collections, 'interactions'):
        result = db.collections.interactions.delete_many({
            'learner_id': {'$in': mock_learner_ids}
        })
        print(f"  Deleted {result.deleted_count} interaction records")

    # Delete the mock learners themselves
    result = db.collections.learners.delete_many({'is_mock': True})
    print(f"  Deleted {result.deleted_count} mock learners")

    print("\n✅ Mock data cleanup complete!")

    # Show remaining real users
    real_count = db.collections.learners.count_documents({'is_mock': {'$ne': True}})
    print(f"📊 Remaining real users: {real_count}")


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Delete mock users from database')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be deleted without actually deleting')

    args = parser.parse_args()

    if not args.dry_run:
        confirm = input("⚠️  This will permanently delete mock users. Type 'yes' to confirm: ")
        if confirm.lower() != 'yes':
            print("Aborted.")
            sys.exit(0)

    delete_mock_users(dry_run=args.dry_run)
