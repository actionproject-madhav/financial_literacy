#!/usr/bin/env python3
"""
Create indexes for the lesson_completions collection for optimal performance.
This ensures scalability as the user base grows.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Database
from pymongo import ASCENDING, DESCENDING

def create_indexes():
    """Create all necessary indexes for lesson_completions collection."""
    db = Database()
    if not db.is_connected:
        print("❌ Cannot connect to database. Check your MONGO_URI in .env")
        return False
    
    collection = db.db.lesson_completions
    
    print("📊 Creating indexes for lesson_completions collection...")
    print("=" * 60)
    
    # 1. Compound index for learner + lesson (most common query)
    # This is the PRIMARY query pattern: find completion for specific learner+lesson
    collection.create_index(
        [('learner_id', ASCENDING), ('lesson_id', ASCENDING)],
        unique=True,
        name='learner_lesson_unique'
    )
    print("✅ Created unique index: learner_id + lesson_id")
    
    # 2. Index for learner queries (get all completions for a learner)
    collection.create_index(
        [('learner_id', ASCENDING), ('completed_at', DESCENDING)],
        name='learner_completions_by_date'
    )
    print("✅ Created index: learner_id + completed_at (for progress history)")
    
    # 3. Index for lesson analytics (how many learners completed a lesson)
    collection.create_index(
        [('lesson_id', ASCENDING), ('status', ASCENDING)],
        name='lesson_analytics'
    )
    print("✅ Created index: lesson_id + status (for analytics)")
    
    # 4. Index for module-level queries
    collection.create_index(
        [('module_id', ASCENDING), ('learner_id', ASCENDING)],
        name='module_learner_progress'
    )
    print("✅ Created index: module_id + learner_id (for module progress)")
    
    # 5. Index for time-based analytics
    collection.create_index(
        [('completed_at', DESCENDING)],
        name='completions_by_date'
    )
    print("✅ Created index: completed_at (for time-based analytics)")
    
    print("=" * 60)
    print("✅ All indexes created successfully!")
    print("\n📈 Collection is now optimized for:")
    print("  • Fast learner progress lookups")
    print("  • Efficient lesson analytics")
    print("  • Module-level progress tracking")
    print("  • Time-based reporting")
    print("  • Scalable to millions of completions")
    
    return True

if __name__ == '__main__':
    success = create_indexes()
    sys.exit(0 if success else 1)

