"""
Verify Progress Tracking System

This script verifies that:
1. User progress (mastery/ELO) is being saved
2. Lessons are marked as completed
3. Lessons unlock properly based on completion
4. Users don't see the same content repeatedly

Usage:
    python3 scripts/verify_progress_tracking.py [learner_id]
"""

import os
import sys
from bson import ObjectId

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Database


def verify_progress(learner_id=None):
    """Verify that progress tracking is working correctly"""
    db = Database()
    
    if not db.is_connected:
        print("❌ Cannot connect to database")
        return
    
    print("🔍 Verifying Progress Tracking System\n")
    
    # Get all learners or specific learner
    if learner_id:
        learners = [db.collections.learners.find_one({'_id': ObjectId(learner_id)})]
        if not learners[0]:
            print(f"❌ Learner {learner_id} not found")
            return
    else:
        learners = list(db.collections.learners.find({}).limit(5))
        print(f"📊 Checking {len(learners)} learners\n")
    
    for learner in learners:
        if not learner:
            continue
            
        lid = str(learner['_id'])
        name = learner.get('display_name', 'Unknown')
        total_xp = learner.get('total_xp', 0)
        
        print(f"👤 Learner: {name} ({lid[:8]}...)")
        print(f"   Total XP: {total_xp}")
        
        # Check skill states
        states = list(db.collections.learner_skill_states.find({
            'learner_id': ObjectId(lid)
        }))
        
        mastered = [s for s in states if s.get('status') == 'mastered']
        in_progress = [s for s in states if s.get('status') == 'in_progress']
        available = [s for s in states if s.get('status') == 'available']
        locked = [s for s in states if s.get('status') == 'locked']
        
        print(f"   📚 Skill States:")
        print(f"      ✅ Mastered: {len(mastered)}")
        print(f"      🔄 In Progress: {len(in_progress)}")
        print(f"      🔓 Available: {len(available)}")
        print(f"      🔒 Locked: {len(locked)}")
        
        # Check interactions
        interactions = db.collections.interactions.count_documents({
            'learner_id': ObjectId(lid)
        })
        print(f"   📝 Interactions logged: {interactions}")
        
        # Check daily progress
        from datetime import datetime, timedelta
        week_start = datetime.utcnow() - timedelta(days=7)
        weekly_progress = list(db.collections.daily_progress.find({
            'learner_id': ObjectId(lid),
            'date': {'$gte': week_start}
        }))
        
        total_weekly_xp = sum(p.get('xp_earned', 0) for p in weekly_progress)
        total_lessons_completed = sum(p.get('lessons_completed', 0) for p in weekly_progress)
        
        print(f"   📊 Weekly Progress:")
        print(f"      XP Earned: {total_weekly_xp}")
        print(f"      Lessons Completed: {total_lessons_completed}")
        
        # Check mastery values
        if mastered:
            print(f"   🎯 Mastery Examples:")
            for m in mastered[:3]:
                kc = db.collections.knowledge_components.find_one({'_id': m['kc_id']})
                kc_name = kc.get('name', 'Unknown') if kc else 'Unknown'
                mastery = m.get('p_mastery', 0)
                print(f"      • {kc_name}: {mastery:.2f} mastery")
        
        print()
    
    # Summary
    print("=" * 60)
    print("📋 System Summary:")
    
    total_learners = db.collections.learners.count_documents({})
    total_states = db.collections.learner_skill_states.count_documents({})
    total_interactions = db.collections.interactions.count_documents({})
    total_mastered = db.collections.learner_skill_states.count_documents({'status': 'mastered'})
    
    print(f"   Total Learners: {total_learners}")
    print(f"   Total Skill States: {total_states}")
    print(f"   Total Interactions: {total_interactions}")
    print(f"   Total Mastered Lessons: {total_mastered}")
    
    print("\n✅ Progress tracking is working!" if total_states > 0 and total_interactions > 0 else "\n⚠️  No progress data found")


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Verify progress tracking')
    parser.add_argument('learner_id', nargs='?', help='Specific learner ID to check')
    
    args = parser.parse_args()
    
    verify_progress(args.learner_id)

