"""
Add module_id and lesson_id references to questions and update module documents

This script ensures proper data integrity and scalability by:
1. Adding lesson_id and module_id to all learning_items (questions)
2. Adding lesson_ids array to curriculum_modules
3. Enabling efficient queries like "all questions in module X"
"""

from database import Database
from bson import ObjectId
from datetime import datetime

def add_references():
    db = Database()
    if not db.is_connected:
        print("❌ Cannot connect to database")
        return
    
    print("="*70)
    print("ADDING MODULE/LESSON REFERENCES FOR SCALABILITY")
    print("="*70)
    
    # Step 1: Add lesson_ids to modules
    print("\n1. Updating curriculum_modules with lesson_ids...")
    modules = list(db.collections.curriculum_modules.find({}))
    
    for module in modules:
        module_id = module['module_id']
        
        # Find all lessons for this module
        lessons = list(db.collections.curriculum_lessons.find({'module_id': module_id}))
        lesson_ids = [lesson['lesson_id'] for lesson in lessons]
        
        # Update module with lesson_ids
        db.collections.curriculum_modules.update_one(
            {'_id': module['_id']},
            {
                '$set': {
                    'lesson_ids': lesson_ids,
                    'lesson_count': len(lesson_ids),
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        print(f"   ✅ {module['name']}: {len(lesson_ids)} lessons")
    
    # Step 2: Add lesson_id and module_id to questions
    print("\n2. Updating learning_items (questions) with lesson_id and module_id...")
    
    lessons = list(db.collections.curriculum_lessons.find({}))
    total_questions_updated = 0
    
    for lesson in lessons:
        lesson_id = lesson['lesson_id']
        module_id = lesson['module_id']
        question_ids = lesson.get('questions', [])
        
        if not question_ids:
            print(f"   ⚠️  {lesson['title']}: No questions")
            continue
        
        # Convert string IDs to ObjectIds
        question_oids = [ObjectId(qid) for qid in question_ids if ObjectId.is_valid(qid)]
        
        # Update all questions for this lesson
        result = db.collections.learning_items.update_many(
            {'_id': {'$in': question_oids}},
            {
                '$set': {
                    'lesson_id': lesson_id,
                    'module_id': module_id,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        total_questions_updated += result.modified_count
        print(f"   ✅ {lesson['title']}: {result.modified_count} questions updated")
    
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    print(f"Modules updated: {len(modules)}")
    print(f"Questions updated: {total_questions_updated}")
    print("\n✅ All references added successfully!")
    print("\nNow you can query:")
    print("  - All lessons in a module: db.curriculum_modules.find_one({'module_id': 'X'})['lesson_ids']")
    print("  - All questions in a module: db.learning_items.find({'module_id': 'X'})")
    print("  - All questions in a lesson: db.learning_items.find({'lesson_id': 'X'})")
    print("="*70)

if __name__ == '__main__':
    add_references()

