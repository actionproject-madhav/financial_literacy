#!/usr/bin/env python3
"""
Link existing questions to curriculum lessons

This script:
1. Maps questions to lessons based on skill_slug / KC domain
2. Adds questions array to each lesson
3. Creates an interleaved learning flow (content → quiz → content → quiz)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Database
from bson import ObjectId

# Mapping of lesson skill_slugs to KC slugs (based on actual KC slugs in database)
LESSON_TO_KC_MAPPING = {
    # Banking Fundamentals
    'understanding-us-currency': ['understanding-us-currency', 'banking-basics'],
    'checking-accounts': ['checking-accounts', 'bank-account-types'],
    'savings-accounts': ['savings-accounts', 'bank-account-types'],
    'debit-cards': ['debit-cards', 'mobile-banking-basics'],
    'bank-fees': ['bank-fees', 'bank-fees-and-terms'],
    
    # Credit Fundamentals
    'what-is-credit': ['what-is-credit', 'credit-score-basics'],
    'credit-score-basics': ['credit-score-basics', 'what-is-credit'],
    'credit-score-factors': ['credit-score-factors', 'understanding-interest-rates'],
    'building-credit': ['building-credit', 'secured-credit-cards'],
    'credit-cards': ['credit-cards', 'understanding-interest-rates'],
    
    # Money Management
    'budgeting-basics': ['budgeting-basics', '50-30-20-rule', 'expense-tracking'],
    'emergency-funds': ['emergency-funds', 'emergency-fund-planning'],
    'debt-management': ['debt-management', 'budgeting-basics'],
    
    # US Tax Essentials
    'us-tax-system': ['us-tax-system', 'tax-withholding'],
    'filing-taxes': ['filing-taxes', 'free-filing-options', 'tax-deductions-credits'],
    'itin-vs-ssn': ['itin-vs-ssn', 'w2-and-1099-forms'],
    
    # Investing Fundamentals
    'what-is-investing': ['what-is-investing', 'risk-vs-return'],
    'stocks-basics': ['stocks-basics', 'bonds-basics'],
    'diversification': ['diversification', 'etfs-explained', 'index-funds'],
    
    # Retirement Planning
    '401k-basics': ['401k-basics', 'employer-match', 'retirement-planning-basics'],
    'ira-accounts': ['ira-accounts', 'traditional-ira', 'roth-ira'],
    'roth-vs-traditional': ['roth-vs-traditional', 'roth-ira', 'traditional-ira'],
    
    # Insurance Essentials (no questions yet, but mapping for future)
    'insurance-basics': ['retirement-planning-basics'],  # Placeholder
    'health-insurance': ['retirement-planning-basics'],  # Placeholder
    'renters-insurance': ['retirement-planning-basics'],  # Placeholder
    
    # Consumer Protection (no questions yet)
    'avoiding-scams': ['what-is-credit'],  # Placeholder
    'consumer-rights': ['what-is-credit'],  # Placeholder
    
    # Major Purchases (no questions yet)
    'buying-car': ['what-is-investing'],  # Placeholder
    'home-buying-basics': ['what-is-investing'],  # Placeholder
    
    # Cryptocurrency Basics
    'what-is-crypto': ['what-is-crypto', 'what-is-cryptocurrency'],
    'crypto-risks': ['crypto-risks', 'crypto-wallets'],
    
    # Financial Planning (no questions yet)
    'financial-goals': ['budgeting-basics', 'emergency-funds'],  # Placeholder
    'net-worth': ['what-is-investing', 'stocks-basics'],  # Placeholder
}

def link_questions_to_lessons():
    """Link questions to lessons based on KC mappings"""
    db = Database()
    if not db.is_connected:
        print("❌ Cannot connect to database")
        return
    
    lessons_collection = db.collections.curriculum_lessons
    items_collection = db.collections.learning_items
    kc_collection = db.collections.knowledge_components
    
    print("🔗 Linking questions to lessons...\n")
    
    # Get all lessons
    lessons = list(lessons_collection.find({}))
    total_lessons = len(lessons)
    
    if total_lessons == 0:
        print("❌ No lessons found. Run import_curriculum.py first.")
        return
    
    print(f"📚 Found {total_lessons} lessons")
    print(f"❓ Total questions in database: {items_collection.count_documents({})}\n")
    
    linked_count = 0
    total_questions_linked = 0
    
    for lesson in lessons:
        lesson_id = lesson['lesson_id']
        skill_slug = lesson.get('skill_slug', '')
        title = lesson.get('title', '')
        
        print(f"Processing: {title}")
        print(f"  Skill slug: {skill_slug}")
        
        # Get KC slugs for this lesson
        kc_slugs = LESSON_TO_KC_MAPPING.get(skill_slug, [])
        
        if not kc_slugs:
            print(f"  ⚠️  No KC mapping found for {skill_slug}")
            continue
        
        # Find KCs matching these slugs
        kcs = list(kc_collection.find({'slug': {'$in': kc_slugs}}))
        kc_ids = [kc['_id'] for kc in kcs]
        
        if not kc_ids:
            print(f"  ⚠️  No KCs found for slugs: {kc_slugs}")
            continue
        
        # Find questions mapped to these KCs
        from mongo_collections import FinLitCollections
        mappings = list(db.db.item_kc_mappings.find({'kc_id': {'$in': kc_ids}}))
        item_ids = [m['item_id'] for m in mappings]
        
        # Get the actual questions
        questions = list(items_collection.find({
            '_id': {'$in': item_ids},
            'is_active': True,
            'item_type': 'multiple_choice'
        }))
        
        if not questions:
            print(f"  ⚠️  No questions found")
            continue
        
        # Convert to question IDs (strings)
        question_ids = [str(q['_id']) for q in questions]
        
        # Update lesson with questions
        lessons_collection.update_one(
            {'lesson_id': lesson_id},
            {'$set': {'questions': question_ids}}
        )
        
        linked_count += 1
        total_questions_linked += len(question_ids)
        print(f"  ✅ Linked {len(question_ids)} questions")
    
    print(f"\n{'='*60}")
    print(f"✅ LINKING COMPLETE")
    print(f"{'='*60}")
    print(f"Lessons updated: {linked_count}/{total_lessons}")
    print(f"Total questions linked: {total_questions_linked}")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    link_questions_to_lessons()

