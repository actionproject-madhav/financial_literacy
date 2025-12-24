#!/usr/bin/env python3
"""
Sample data seeding script for FinLit MongoDB database

This script creates sample data for testing and development.
Usage: python seed_data.py
"""
from database import Database
from datetime import datetime, timedelta, date
import uuid

def seed_sample_data():
    """Seed the database with sample data"""
    print("="*80)
    print("SEEDING FINLIT MONGODB DATABASE")
    print("="*80)

    # Initialize database
    db = Database()

    if not db.is_connected:
        print("❌ Cannot connect to database. Check your MONGO_URI in .env")
        return

    # Create indexes first
    print("\n📊 Creating indexes...")
    db.initialize_indexes()

    collections = db.collections

    print("\n👤 Creating sample learners...")

    # Sample learners
    learners = []

    learner1_id = collections.create_learner(
        email="maria.garcia@example.com",
        display_name="Maria Garcia",
        native_language="Spanish",
        english_proficiency="intermediate",
        immigration_status="H1B",
        country_of_origin="Mexico",
        visa_type="H1B",
        has_ssn=True,
        sends_remittances=True,
        financial_goals=["emergency_fund", "retirement", "home_purchase"],
        financial_experience_level="novice",
        daily_goal_minutes=15,
        timezone="America/Los_Angeles"
    )
    learners.append(learner1_id)
    print(f"  ✓ Created learner: Maria Garcia ({learner1_id})")

    learner2_id = collections.create_learner(
        email="raj.patel@example.com",
        display_name="Raj Patel",
        native_language="Hindi",
        english_proficiency="advanced",
        immigration_status="Green Card",
        country_of_origin="India",
        visa_type="Green Card",
        has_ssn=True,
        sends_remittances=False,
        financial_goals=["investing", "college_fund"],
        financial_experience_level="intermediate",
        daily_goal_minutes=20,
        timezone="America/New_York"
    )
    learners.append(learner2_id)
    print(f"  ✓ Created learner: Raj Patel ({learner2_id})")

    print("\n📚 Creating knowledge components...")

    # Create knowledge components
    kcs = {}

    # Credit domain
    credit_basics_id = collections.create_knowledge_component(
        slug="credit-score-basics",
        name="Understanding Credit Scores",
        description="Learn what credit scores are, how they're calculated, and why they matter for your financial future in the US",
        domain="credit",
        difficulty_tier=1,
        bloom_level="understand",
        estimated_minutes=20,
        icon_url="/icons/credit-score.svg"
    )
    kcs['credit_basics'] = credit_basics_id
    print(f"  ✓ Created KC: Credit Score Basics ({credit_basics_id})")

    credit_building_id = collections.create_knowledge_component(
        slug="building-credit",
        name="Building Credit History",
        description="Strategies for establishing and improving your credit score",
        domain="credit",
        parent_kc_id=credit_basics_id,
        difficulty_tier=2,
        bloom_level="apply",
        estimated_minutes=25,
        icon_url="/icons/credit-building.svg"
    )
    kcs['credit_building'] = credit_building_id
    print(f"  ✓ Created KC: Building Credit ({credit_building_id})")

    # Banking domain
    banking_basics_id = collections.create_knowledge_component(
        slug="banking-basics",
        name="Banking Fundamentals",
        description="Understanding bank accounts, fees, and services in the US",
        domain="banking",
        difficulty_tier=1,
        bloom_level="understand",
        estimated_minutes=15,
        icon_url="/icons/bank.svg"
    )
    kcs['banking_basics'] = banking_basics_id
    print(f"  ✓ Created KC: Banking Basics ({banking_basics_id})")

    print("\n📝 Creating learning items...")

    # Create learning items
    items = {}

    item1_id = collections.create_learning_item(
        item_type="multiple_choice",
        content={
            "stem": "What is the typical range for FICO credit scores in the United States?",
            "choices": [
                "0 to 100",
                "100 to 500",
                "300 to 850",
                "500 to 1000"
            ],
            "correct_answer": 2,
            "explanation": "FICO credit scores range from 300 to 850, with higher scores indicating better creditworthiness. Most lenders consider a score above 670 as good.",
            "visa_variants": {
                "H1B": {
                    "additional_context": "As an H1B visa holder, you're starting fresh in the US credit system. Your credit history from your home country doesn't transfer."
                }
            }
        },
        difficulty=0.3,
        discrimination=1.2,
        allows_llm_personalization=True
    )
    items['credit_score_range'] = item1_id
    print(f"  ✓ Created item: Credit Score Range ({item1_id})")

    item2_id = collections.create_learning_item(
        item_type="multiple_choice",
        content={
            "stem": "Which of the following is the most important factor in calculating your credit score?",
            "choices": [
                "Your income",
                "Payment history",
                "Number of credit cards",
                "Age"
            ],
            "correct_answer": 1,
            "explanation": "Payment history accounts for about 35% of your FICO score, making it the single most important factor. Always pay at least the minimum on time.",
            "visa_variants": {}
        },
        difficulty=0.4,
        discrimination=1.1
    )
    items['payment_history'] = item2_id
    print(f"  ✓ Created item: Payment History ({item2_id})")

    item3_id = collections.create_learning_item(
        item_type="multiple_choice",
        content={
            "stem": "What type of bank account should you open first when moving to the US?",
            "choices": [
                "Savings account only",
                "Investment account",
                "Checking account",
                "Money market account"
            ],
            "correct_answer": 2,
            "explanation": "A checking account is essential for daily transactions, receiving paychecks via direct deposit, and paying bills. You can add a savings account later.",
            "visa_variants": {}
        },
        difficulty=0.2,
        discrimination=0.9
    )
    items['first_account'] = item3_id
    print(f"  ✓ Created item: First Bank Account ({item3_id})")

    print("\n🔗 Creating item-KC mappings...")

    # Map items to knowledge components
    collections.create_item_kc_mapping(item1_id, credit_basics_id, weight=1.0)
    collections.create_item_kc_mapping(item2_id, credit_basics_id, weight=1.0)
    collections.create_item_kc_mapping(item3_id, banking_basics_id, weight=1.0)
    print(f"  ✓ Created 3 item-KC mappings")

    print("\n🎯 Creating learner skill states...")

    # Initialize skill states for Maria
    collections.create_learner_skill_state(
        learner1_id,
        credit_basics_id,
        status='available'
    )
    collections.create_learner_skill_state(
        learner1_id,
        banking_basics_id,
        status='available'
    )
    collections.create_learner_skill_state(
        learner1_id,
        credit_building_id,
        status='locked'
    )
    print(f"  ✓ Created skill states for Maria")

    # Initialize skill states for Raj
    collections.create_learner_skill_state(
        learner2_id,
        credit_basics_id,
        status='in_progress',
        p_mastery=0.6,
        total_attempts=5,
        correct_count=4
    )
    collections.create_learner_skill_state(
        learner2_id,
        banking_basics_id,
        status='mastered',
        p_mastery=0.95,
        total_attempts=10,
        correct_count=10,
        mastered_at=datetime.utcnow() - timedelta(days=7)
    )
    print(f"  ✓ Created skill states for Raj")

    print("\n💬 Creating sample interactions...")

    # Create sample interactions for Raj
    session_id = str(uuid.uuid4())

    collections.create_interaction(
        learner_id=learner2_id,
        item_id=item1_id,
        kc_id=credit_basics_id,
        session_id=session_id,
        is_correct=True,
        response_value={"selected_choice": 2},
        response_time_ms=8500,
        hint_used=False,
        p_mastery_before=0.5,
        retrievability_before=1.0,
        selection_method="adaptive",
        predicted_p_correct=0.6
    )

    collections.create_interaction(
        learner_id=learner2_id,
        item_id=item2_id,
        kc_id=credit_basics_id,
        session_id=session_id,
        is_correct=True,
        response_value={"selected_choice": 1},
        response_time_ms=12000,
        hint_used=False,
        p_mastery_before=0.6,
        retrievability_before=0.95,
        selection_method="adaptive",
        predicted_p_correct=0.7
    )
    print(f"  ✓ Created 2 interactions for Raj")

    # Update item statistics
    collections.update_item_statistics(item1_id, is_correct=True, response_time_ms=8500)
    collections.update_item_statistics(item2_id, is_correct=True, response_time_ms=12000)

    print("\n🏆 Creating achievements...")

    # Create achievements
    first_steps = collections.create_achievement(
        slug="first-steps",
        name="First Steps",
        description="Complete your first lesson",
        icon_url="/icons/achievements/first-steps.svg",
        xp_reward=50,
        criteria={"type": "lessons_completed", "count": 1}
    )
    print(f"  ✓ Created achievement: First Steps ({first_steps})")

    week_warrior = collections.create_achievement(
        slug="week-warrior",
        name="Week Warrior",
        description="Maintain a 7-day streak",
        icon_url="/icons/achievements/week-warrior.svg",
        xp_reward=100,
        criteria={"type": "streak", "days": 7}
    )
    print(f"  ✓ Created achievement: Week Warrior ({week_warrior})")

    # Award achievement to Raj
    collections.award_achievement(learner2_id, first_steps)
    print(f"  ✓ Awarded 'First Steps' to Raj")

    print("\n📅 Creating daily progress...")

    # Create daily progress for last 7 days for Raj
    for i in range(7):
        progress_date = date.today() - timedelta(days=i)
        collections.update_daily_progress(
            learner_id=learner2_id,
            date_obj=progress_date,
            xp_earned=50 + (i * 10),
            lessons_completed=1 if i < 5 else 2,
            minutes_practiced=15 + (i * 2)
        )
    print(f"  ✓ Created 7 days of progress for Raj")

    # Update learner XP and streak
    collections.add_xp(learner2_id, 450)
    collections.update_streak(learner2_id, increment=True)
    collections.learners.update_one(
        {'_id': collections.learners.find_one({'email': 'raj.patel@example.com'})['_id']},
        {'$set': {'streak_count': 7, 'streak_last_date': date.today()}}
    )
    print(f"  ✓ Updated Raj's XP and streak")

    print("\n🌍 Creating cultural contexts...")

    # Add cultural context
    collections.cultural_contexts.insert_one({
        'kc_id': collections.knowledge_components.find_one({'slug': 'credit-score-basics'})['_id'],
        'country_code': 'MEX',
        'context_type': 'comparison',
        'content': "In Mexico, credit bureaus like Buró de Crédito work similarly to U.S. credit bureaus. However, your Mexican credit history won't transfer to the US, so you'll need to build your credit from scratch.",
        'is_verified': True
    })

    collections.cultural_contexts.insert_one({
        'kc_id': collections.knowledge_components.find_one({'slug': 'credit-score-basics'})['_id'],
        'country_code': 'IND',
        'context_type': 'comparison',
        'content': "Unlike India's CIBIL score system, the US uses FICO scores ranging from 300-850. The principles are similar, but you'll start with no credit history in the US.",
        'is_verified': True
    })
    print(f"  ✓ Created 2 cultural contexts")

    print("\n🔗 Creating KC prerequisites...")

    # Create prerequisite relationship
    collections.kc_prerequisites.insert_one({
        'kc_id': collections.knowledge_components.find_one({'slug': 'building-credit'})['_id'],
        'prerequisite_kc_id': collections.knowledge_components.find_one({'slug': 'credit-score-basics'})['_id'],
        'is_required': True
    })
    print(f"  ✓ Created prerequisite: Building Credit requires Credit Basics")

    print("\n" + "="*80)
    print("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!")
    print("="*80)
    print("\n📊 Summary:")
    print(f"  • Learners: 2")
    print(f"  • Knowledge Components: 3")
    print(f"  • Learning Items: 3")
    print(f"  • Interactions: 2")
    print(f"  • Achievements: 2")
    print(f"  • Daily Progress Records: 7")
    print(f"  • Cultural Contexts: 2")
    print(f"  • Prerequisites: 1")
    print("\n💡 You can now:")
    print("  • Test the API endpoints with this sample data")
    print("  • Login as maria.garcia@example.com or raj.patel@example.com")
    print("  • View Raj's progress (7-day streak, 450 XP)")
    print("  • Explore the learning items and knowledge components")
    print("\n")


if __name__ == '__main__':
    seed_sample_data()
