"""
Add Questions to Empty Lessons

This script finds lessons with 0 items and adds relevant questions from seed_questions.json
or creates basic questions for them.

Usage:
    python3 scripts/add_questions_to_empty_lessons.py
"""

import os
import sys
import json
from bson import ObjectId

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Database


# Basic questions for "Types of Bank Accounts"
TYPES_OF_BANK_ACCOUNTS_QUESTIONS = [
    {
        "stem": "What is the main purpose of a checking account?",
        "choices": [
            "To save money long-term",
            "To make daily transactions and pay bills",
            "To earn high interest",
            "To invest in stocks"
        ],
        "correct_answer": 1,
        "explanation": "Checking accounts are designed for frequent transactions like paying bills, making purchases, and withdrawing cash. They typically don't earn much interest but offer easy access to your money."
    },
    {
        "stem": "Which type of bank account typically earns the most interest?",
        "choices": [
            "Checking account",
            "Savings account",
            "Money market account",
            "Certificate of Deposit (CD)"
        ],
        "correct_answer": 3,
        "explanation": "Certificates of Deposit (CDs) typically offer the highest interest rates because you agree to keep your money in the account for a fixed period. However, you can't withdraw the money early without penalties."
    },
    {
        "stem": "What is a key difference between a savings account and a checking account?",
        "choices": [
            "Savings accounts have no fees",
            "Savings accounts limit the number of withdrawals per month",
            "Checking accounts earn more interest",
            "You need a minimum balance for checking accounts"
        ],
        "correct_answer": 1,
        "explanation": "Savings accounts typically limit you to 6 withdrawals per month (federal regulation), while checking accounts allow unlimited transactions. This is why savings accounts are better for storing money you don't need immediately."
    },
    {
        "stem": "What is a money market account?",
        "choices": [
            "An account that invests in the stock market",
            "A hybrid account with checking and savings features",
            "An account only for businesses",
            "A type of credit card"
        ],
        "correct_answer": 1,
        "explanation": "A money market account is a hybrid account that combines features of checking and savings accounts. It typically offers higher interest rates than regular savings accounts and may come with check-writing privileges, but often requires a higher minimum balance."
    },
    {
        "stem": "Which account is best for someone who wants to save for an emergency fund?",
        "choices": [
            "Checking account",
            "Savings account",
            "Certificate of Deposit",
            "Investment account"
        ],
        "correct_answer": 1,
        "explanation": "A savings account is ideal for emergency funds because it's easily accessible (though with withdrawal limits), earns some interest, and keeps your money safe. CDs lock your money away, and investment accounts can lose value."
    }
]

# Basic questions for "Bank Fees and Terms"
BANK_FEES_QUESTIONS = [
    {
        "stem": "What is an overdraft fee?",
        "choices": [
            "A fee for withdrawing too much money",
            "A fee charged when you spend more than you have in your account",
            "A fee for closing your account",
            "A monthly maintenance fee"
        ],
        "correct_answer": 1,
        "explanation": "An overdraft fee is charged when you make a transaction that exceeds your account balance. Banks may cover the transaction but charge you a fee (typically $25-35). You can avoid this by monitoring your balance or opting out of overdraft protection."
    },
    {
        "stem": "What is a minimum balance requirement?",
        "choices": [
            "The maximum amount you can have in an account",
            "The smallest amount you must keep in an account to avoid fees",
            "The amount needed to open an account",
            "The daily withdrawal limit"
        ],
        "correct_answer": 1,
        "explanation": "A minimum balance requirement is the smallest amount of money you must keep in your account to avoid monthly maintenance fees. If your balance drops below this amount, the bank may charge you a fee."
    },
    {
        "stem": "What does APR stand for in banking?",
        "choices": [
            "Annual Percentage Rate",
            "Account Payment Requirement",
            "Automatic Payment Rate",
            "Account Protection Rule"
        ],
        "correct_answer": 0,
        "explanation": "APR stands for Annual Percentage Rate. It represents the yearly cost of borrowing money, including interest and fees. A lower APR means you'll pay less to borrow money."
    }
]

# Basic questions for "Mobile Banking Basics"
MOBILE_BANKING_QUESTIONS = [
    {
        "stem": "What is mobile banking?",
        "choices": [
            "Banking only available on mobile phones",
            "Using a smartphone app to manage your bank account",
            "Banking while traveling",
            "A type of online-only bank"
        ],
        "correct_answer": 1,
        "explanation": "Mobile banking refers to using a smartphone app provided by your bank to manage your account, check balances, transfer money, pay bills, and deposit checks from anywhere."
    },
    {
        "stem": "What is mobile check deposit?",
        "choices": [
            "Depositing cash at an ATM",
            "Taking a photo of a check with your phone to deposit it",
            "Writing a check on your phone",
            "Using your phone as a credit card"
        ],
        "correct_answer": 1,
        "explanation": "Mobile check deposit allows you to deposit a check by taking photos of the front and back with your smartphone camera. The money is usually available within 1-2 business days."
    }
]

# Basic questions for "Wire Transfers and Remittances"
WIRE_TRANSFER_QUESTIONS = [
    {
        "stem": "What is a wire transfer?",
        "choices": [
            "Sending money through the mail",
            "An electronic transfer of money between banks",
            "Using a credit card to pay",
            "Withdrawing cash from an ATM"
        ],
        "correct_answer": 1,
        "explanation": "A wire transfer is an electronic method of sending money directly from one bank account to another. It's fast (usually same day) but often comes with fees ($15-50)."
    },
    {
        "stem": "What is a remittance?",
        "choices": [
            "Money sent to family in another country",
            "A bank fee",
            "Interest earned on savings",
            "A type of loan"
        ],
        "correct_answer": 0,
        "explanation": "A remittance is money sent by immigrants or workers to family members in their home country. This is a common financial practice for many people living in the US."
    }
]


def add_questions_to_lesson(db, kc_id, kc_name, questions_data):
    """Add questions to a lesson"""
    from mongo_collections import FinLitCollections
    collections = FinLitCollections(db.db)
    
    added_count = 0
    for q_data in questions_data:
        # Create learning item
        content = {
            'stem': q_data['stem'],
            'choices': q_data['choices'],
            'correct_answer': q_data['correct_answer'],
            'explanation': q_data.get('explanation', '')
        }
        
        item_id = collections.create_learning_item(
            item_type='multiple_choice',
            content=content
        )
        
        # Map item to KC
        collections.create_item_kc_mapping(
            item_id=item_id,
            kc_id=kc_id
        )
        
        added_count += 1
    
    return added_count


def fix_empty_lessons():
    """Find and fix lessons with no content"""
    db = Database()
    
    if not db.is_connected:
        print("❌ Cannot connect to database")
        return
    
    print("🔍 Finding lessons with no content...\n")
    
    # Get all active KCs
    all_kcs = list(db.collections.knowledge_components.find({'is_active': True}))
    
    empty_lessons = []
    for kc in all_kcs:
        kc_id = kc['_id']
        item_count = db.collections.item_kc_mappings.count_documents({'kc_id': kc_id})
        
        if item_count == 0:
            empty_lessons.append({
                'kc_id': str(kc_id),
                'name': kc.get('name', 'Unknown'),
                'slug': kc.get('slug', ''),
                'domain': kc.get('domain', '')
            })
    
    if not empty_lessons:
        print("✅ All lessons have content!")
        return
    
    print(f"Found {len(empty_lessons)} empty lessons:\n")
    for lesson in empty_lessons:
        print(f"  - {lesson['name']} ({lesson['domain']})")
    
    print("\n📝 Adding questions to empty lessons...\n")
    
    # Map of lesson names to question sets
    question_map = {
        'Types of Bank Accounts': TYPES_OF_BANK_ACCOUNTS_QUESTIONS,
        'Bank Fees and Terms': BANK_FEES_QUESTIONS,
        'Bank Fees & Terms': BANK_FEES_QUESTIONS,  # Alternative name
        'Mobile Banking Basics': MOBILE_BANKING_QUESTIONS,
        'Wire Transfers and Remittances': WIRE_TRANSFER_QUESTIONS
    }
    
    total_added = 0
    for lesson in empty_lessons:
        kc_id = lesson['kc_id']
        name = lesson['name']
        
        # Find matching questions
        questions = None
        for key, qs in question_map.items():
            if key.lower() in name.lower() or name.lower() in key.lower():
                questions = qs
                break
        
        if questions:
            added = add_questions_to_lesson(db, kc_id, name, questions)
            print(f"✅ Added {added} questions to '{name}'")
            total_added += added
        else:
            print(f"⚠️  No questions found for '{name}' - skipping")
    
    print(f"\n✅ Added {total_added} questions total!")


if __name__ == '__main__':
    fix_empty_lessons()

