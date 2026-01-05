#!/usr/bin/env python3
"""
Migrate lesson completion data from learners.completed_lessons (nested object)
to the new lesson_completions collection (scalable).
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Database
from datetime import datetime
from bson import ObjectId

def migrate_completions():
    """Migrate lesson completions to separate collection."""
    db = Database()
    if not db.is_connected:
        print("❌ Cannot connect to database. Check your MONGO_URI in .env")
        return False
    
    learners_collection = db.collections.learners
    completions_collection = db.db.lesson_completions
    
    print("🔄 Migrating lesson completions to scalable structure...")
    print("=" * 60)
    
    # Get all learners with completed_lessons
    learners = learners_collection.find({'completed_lessons': {'$exists': True}})
    
    migrated_count = 0
    skipped_count = 0
    
    for learner in learners:
        learner_id = learner['_id']
        completed_lessons = learner.get('completed_lessons', {})
        
        if not completed_lessons:
            continue
        
        print(f"\nMigrating learner {learner_id}...")
        
        for lesson_id, completion_data in completed_lessons.items():
            # Check if already migrated
            existing = completions_collection.find_one({
                'learner_id': learner_id,
                'lesson_id': lesson_id
            })
            
            if existing:
                print(f"  ⏭️  Skipping {lesson_id} (already migrated)")
                skipped_count += 1
                continue
            
            # Create new completion record
            completion_record = {
                'learner_id': learner_id,
                'lesson_id': lesson_id,
                'module_id': completion_data.get('module_id', 'unknown'),
                'status': completion_data.get('status', 'mastered'),
                'p_mastery': completion_data.get('p_mastery', 1.0),
                'accuracy': completion_data.get('accuracy', 1.0),
                'completed_at': completion_data.get('completed_at', datetime.utcnow()),
                'first_completed_at': completion_data.get('completed_at', datetime.utcnow()),
                'xp_earned': completion_data.get('xp_earned', 0),
                'time_spent_minutes': completion_data.get('time_spent_minutes', 0),
                'completion_count': 1
            }
            
            completions_collection.insert_one(completion_record)
            print(f"  ✅ Migrated {lesson_id}")
            migrated_count += 1
    
    print("\n" + "=" * 60)
    print(f"✅ Migration complete!")
    print(f"  • Migrated: {migrated_count} completions")
    print(f"  • Skipped: {skipped_count} (already existed)")
    print(f"  • Total in new collection: {completions_collection.count_documents({})}")
    print("\n⚠️  Old data still exists in learners.completed_lessons")
    print("   Run cleanup script after verifying migration if needed.")
    print("=" * 60)
    
    return True

if __name__ == '__main__':
    success = migrate_completions()
    sys.exit(0 if success else 1)

