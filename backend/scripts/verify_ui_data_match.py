"""
Verify that UI expectations match database reality for modules, lessons, XP, and questions
"""

from database import Database

# Mapping from old domain IDs to new module IDs
DOMAIN_TO_MODULE_MAP = {
    'banking': 'banking-fundamentals',
    'credit': 'credit-fundamentals',
    'money-management': 'money-management',
    'taxes': 'taxes',
    'investing': 'investing-basics',
    'retirement': 'retirement-planning',
    'insurance': 'insurance',
    'consumer-protection': 'consumer-protection',
    'major-purchases': 'major-purchases',
    'crypto': 'crypto-basics',
    'cryptocurrency': 'crypto-basics',  # Alias
    'financial-planning': 'financial-planning'
}

# Module metadata (matches DOMAIN_METADATA from curriculum.py)
MODULE_METADATA = {
    'banking-fundamentals': {
        'domain_id': 'banking',
        'title': 'Banking Basics',
        'description': 'Master US banking fundamentals.',
        'level': 'beginner',
        'order': 1
    },
    'credit-fundamentals': {
        'domain_id': 'credit',
        'title': 'Credit Mastery',
        'description': 'Build and maintain excellent credit in the US financial system.',
        'level': 'beginner',
        'order': 2
    },
    'money-management': {
        'domain_id': 'money-management',
        'title': 'Money Management',
        'description': 'Budget, save, and manage your finances effectively.',
        'level': 'beginner',
        'order': 3
    },
    'taxes': {
        'domain_id': 'taxes',
        'title': 'US Tax System',
        'description': 'Navigate the US tax system with confidence.',
        'level': 'intermediate',
        'order': 4
    },
    'investing-basics': {
        'domain_id': 'investing',
        'title': 'Investing Fundamentals',
        'description': 'Start your investment journey with stocks, bonds, and retirement accounts.',
        'level': 'intermediate',
        'order': 5
    },
    'retirement-planning': {
        'domain_id': 'retirement',
        'title': 'Retirement Planning',
        'description': 'Plan for a secure retirement with 401(k)s and IRAs.',
        'level': 'intermediate',
        'order': 6
    },
    'insurance': {
        'domain_id': 'insurance',
        'title': 'Insurance Essentials',
        'description': 'Protect yourself and your assets with the right insurance.',
        'level': 'intermediate',
        'order': 7
    },
    'consumer-protection': {
        'domain_id': 'consumer-protection',
        'title': 'Consumer Protection',
        'description': 'Know your rights and protect yourself from scams.',
        'level': 'beginner',
        'order': 8
    },
    'major-purchases': {
        'domain_id': 'major-purchases',
        'title': 'Major Purchases',
        'description': 'Make smart decisions on cars, homes, and other big purchases.',
        'level': 'intermediate',
        'order': 9
    },
    'crypto-basics': {
        'domain_id': 'crypto',
        'title': 'Cryptocurrency Basics',
        'description': 'Understand cryptocurrency and its risks.',
        'level': 'advanced',
        'order': 10
    },
    'financial-planning': {
        'domain_id': 'financial-planning',
        'title': 'Financial Planning',
        'description': 'Set goals and track your financial progress.',
        'level': 'intermediate',
        'order': 11
    }
}

def verify_ui_match():
    db = Database()
    if not db.is_connected:
        print("❌ Cannot connect to database")
        return
    
    print("="*70)
    print("UI DATA VERIFICATION")
    print("="*70)
    
    # Get all modules
    modules = list(db.collections.curriculum_modules.find({}).sort('order', 1))
    
    print(f"\n📊 MODULES IN DATABASE: {len(modules)}")
    print(f"📊 MODULES IN METADATA: {len(MODULE_METADATA)}")
    
    all_match = True
    
    for module in modules:
        module_id = module['module_id']
        module_name = module['name']
        
        # Get metadata
        metadata = MODULE_METADATA.get(module_id)
        if not metadata:
            print(f"\n❌ Module '{module_id}' missing from MODULE_METADATA!")
            all_match = False
            continue
        
        # Get actual counts from database
        lessons = list(db.collections.curriculum_lessons.find({'module_id': module_id}))
        question_count = db.collections.learning_items.count_documents({
            'module_id': module_id,
            'item_type': 'multiple_choice'
        })
        total_xp = sum(l.get('xp_reward', 0) for l in lessons)
        content_blocks = sum(len(l.get('content_blocks', [])) for l in lessons)
        
        print(f"\n{'='*70}")
        print(f"Module: {module_name}")
        print(f"ID: {module_id}")
        print(f"Domain ID (for UI): {metadata['domain_id']}")
        print(f"{'='*70}")
        print(f"  Lessons: {len(lessons)}")
        print(f"  Questions: {question_count}")
        print(f"  Content Blocks: {content_blocks}")
        print(f"  Total XP: {total_xp}")
        print(f"  UI Title: {metadata['title']}")
        print(f"  UI Description: {metadata['description']}")
        print(f"  Level: {metadata['level']}")
        print(f"  Order: {metadata['order']}")
        
        # List lessons
        print(f"\n  Lessons:")
        for lesson in lessons:
            lesson_xp = lesson.get('xp_reward', 0)
            lesson_q_count = db.collections.learning_items.count_documents({
                'lesson_id': lesson['lesson_id'],
                'item_type': 'multiple_choice'
            })
            print(f"    - {lesson['title']}: {lesson_q_count} questions, {lesson_xp} XP")
    
    print(f"\n{'='*70}")
    if all_match:
        print("✅ ALL MODULES HAVE METADATA")
        print("✅ UI DATA MATCHES DATABASE")
    else:
        print("❌ SOME MODULES MISSING METADATA")
    print(f"{'='*70}")
    
    # Summary
    print(f"\n📈 OVERALL SUMMARY:")
    total_lessons = db.collections.curriculum_lessons.count_documents({})
    total_questions = db.collections.learning_items.count_documents({'item_type': 'multiple_choice'})
    total_xp = sum(l.get('xp_reward', 0) for l in db.collections.curriculum_lessons.find({}))
    total_content = sum(len(l.get('content_blocks', [])) for l in db.collections.curriculum_lessons.find({}))
    
    print(f"  Modules: {len(modules)}")
    print(f"  Lessons: {total_lessons}")
    print(f"  Questions: {total_questions}")
    print(f"  Content Blocks: {total_content}")
    print(f"  Total XP Available: {total_xp}")

if __name__ == '__main__':
    verify_ui_match()

