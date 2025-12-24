#!/usr/bin/env python3
"""
Example usage of Phase 2 Algorithm Services

This script demonstrates how to use the adaptive learning engine
for a complete learning session workflow.
"""

from database import Database
from services import LearningEngine
import uuid
from datetime import datetime


def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)


def demo_learning_session():
    """Demonstrate a complete learning session"""

    print_section("FINLIT ADAPTIVE LEARNING ENGINE - DEMO")

    # Initialize database
    print("\n🔗 Connecting to database...")
    db = Database()

    if not db.is_connected:
        print("❌ Cannot connect to database. Check your MONGO_URI in .env")
        return

    print("✅ Database connected")

    # Create learning engine
    print("\n🧠 Initializing Learning Engine...")
    engine = LearningEngine(db.collections)
    print("✅ Learning Engine ready")

    # Use Maria from seed data (or create your own learner)
    maria = db.collections.get_learner_by_email("maria.garcia@example.com")

    if not maria:
        print("❌ Sample learner not found. Run seed_data.py first.")
        return

    learner_id = str(maria['_id'])
    print(f"✅ Using learner: {maria['display_name']} ({learner_id})")

    # Initialize KCs for Maria if needed
    print_section("1. Initialize Knowledge Components")
    initialized = engine.initialize_learner_kcs(learner_id)
    print(f"✅ Initialized {initialized} knowledge components")

    # Get learner analytics
    print_section("2. Learner Analytics Overview")
    analytics = engine.get_learner_analytics(learner_id)

    print(f"\n📊 Learner Profile:")
    print(f"   Name: {analytics['display_name']}")
    print(f"   Total XP: {analytics['total_xp']}")
    print(f"   Streak: {analytics['streak_count']} days")
    print(f"   Estimated Ability: {analytics['estimated_ability']:.2f}")
    print(f"   Recent Accuracy: {analytics['recent_accuracy']:.1%}")

    mastery = analytics['mastery_overview']
    print(f"\n📚 Knowledge Components:")
    print(f"   Total: {mastery['total_kcs']}")
    print(f"   Mastered: {mastery['mastered']}")
    print(f"   In Progress: {mastery['in_progress']}")
    print(f"   Available: {mastery['available']}")
    print(f"   Locked: {mastery['locked']}")
    print(f"   Average Mastery: {mastery['avg_mastery']:.1%}")

    # Get learning path
    print_section("3. Recommended Learning Path")
    path = engine.get_learning_path(learner_id)

    if path:
        print("\n🎯 Suggested next steps:")
        for i, step in enumerate(path[:5], 1):
            priority_icon = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(step['priority'], "⚪")
            print(f"\n   {i}. {step['kc_name']}")
            print(f"      Priority: {priority_icon} {step['priority']}")
            print(f"      Reason: {step['reason']}")
            if 'p_mastery' in step:
                print(f"      Current Mastery: {step['p_mastery']:.1%}")
    else:
        print("   No learning path available yet")

    # Get review schedule
    print_section("4. Review Schedule")
    schedule = engine.get_review_schedule(learner_id, days_ahead=7)

    print(f"\n📅 Reviews:")
    print(f"   Due now: {schedule['due_now']}")
    print(f"   Upcoming (7 days): {schedule['total_upcoming']}")

    if schedule['due_items']:
        print("\n   📌 Most urgent reviews:")
        for review in schedule['due_items'][:3]:
            print(f"      • KC {review['kc_id']}")
            print(f"        Days overdue: {review['days_overdue']:.1f}")
            print(f"        Retrievability: {review['retrievability']:.1%}")

    # Create a learning session
    print_section("5. Create Learning Session")
    print("\n🎲 Generating adaptive learning session with 3 items...")

    session = engine.create_learning_session(learner_id, target_items=3)

    if not session:
        print("❌ No items available for learning session")
        return

    print(f"✅ Created session with {len(session)} items")

    session_id = str(uuid.uuid4())

    # Simulate answering questions
    print_section("6. Simulate Learning Session")

    for i, item_data in enumerate(session, 1):
        item = item_data['item']
        kc = item_data['kc']

        print(f"\n📝 Question {i} of {len(session)}")
        print(f"   Knowledge Component: {kc['name']}")
        print(f"   Domain: {kc['domain']}")
        print(f"   Predicted Difficulty: {item_data['predicted_p_correct']:.1%} chance of success")

        if item['item_type'] == 'multiple_choice':
            content = item['content']
            print(f"\n   {content['stem']}")
            print("\n   Choices:")
            for idx, choice in enumerate(content['choices']):
                print(f"      {idx}. {choice}")

            # Simulate answer (let's say learner gets it right)
            correct_answer = content['correct_answer']
            is_correct = True  # Simulating correct answer

            print(f"\n   ✅ Simulating correct answer (choice {correct_answer})")

            # Submit answer
            result = engine.submit_answer(
                learner_id=learner_id,
                item_id=item_data['item_id'],
                kc_id=item_data['kc_id'],
                is_correct=is_correct,
                response_value={"selected_choice": correct_answer},
                response_time_ms=12000,  # 12 seconds
                hint_used=False,
                session_id=session_id
            )

            print(f"\n   📊 Results:")
            print(f"      Mastery: {result['p_mastery_before']:.1%} → {result['p_mastery_after']:.1%}")
            print(f"      Change: {result['mastery_change']:+.1%}")
            print(f"      XP Earned: +{result['xp_earned']}")
            print(f"      Next Review: {result['next_review_date'].strftime('%Y-%m-%d')}")

            if content.get('explanation'):
                print(f"\n   💡 Explanation: {content['explanation']}")

    # Check for achievements
    print_section("7. Check Achievements")
    new_achievements = engine.check_achievements(learner_id)

    if new_achievements:
        print("\n🏆 New achievements unlocked:")
        for achievement in new_achievements:
            print(f"   • {achievement['name']}")
            print(f"     {achievement['description']}")
            print(f"     +{achievement['xp_reward']} XP")
    else:
        print("\n   No new achievements this session")

    # Final analytics
    print_section("8. Updated Analytics")
    final_analytics = engine.get_learner_analytics(learner_id)

    print(f"\n📊 Session Summary:")
    print(f"   Total XP: {final_analytics['total_xp']} (+{final_analytics['total_xp'] - analytics['total_xp']})")
    print(f"   Streak: {final_analytics['streak_count']} days")
    print(f"   Average Mastery: {final_analytics['mastery_overview']['avg_mastery']:.1%}")
    print(f"   Estimated Ability: {final_analytics['estimated_ability']:.2f}")

    print_section("DEMO COMPLETE")
    print("\n✨ The adaptive learning engine successfully:")
    print("   1. Analyzed learner profile and progress")
    print("   2. Recommended optimal learning path")
    print("   3. Generated personalized learning session")
    print("   4. Updated mastery models (BKT)")
    print("   5. Scheduled spaced repetition reviews (FSRS)")
    print("   6. Awarded XP and checked achievements")
    print("\n💡 Next steps:")
    print("   - Integrate with your Flask API")
    print("   - Build frontend UI for learning sessions")
    print("   - Schedule periodic IRT calibration")
    print("   - Monitor learner progress over time")
    print("\n")


def demo_individual_services():
    """Demonstrate individual service usage"""

    print_section("INDIVIDUAL SERVICES DEMO")

    db = Database()
    if not db.is_connected:
        print("❌ Database connection failed")
        return

    engine = LearningEngine(db.collections)

    # Get a learner
    maria = db.collections.get_learner_by_email("maria.garcia@example.com")
    if not maria:
        print("❌ Sample data not found")
        return

    learner_id = str(maria['_id'])

    # Demo BKT
    print("\n🧮 Bayesian Knowledge Tracing (BKT)")
    print("-" * 40)

    # Get a KC
    kc = db.collections.knowledge_components.find_one({'slug': 'credit-score-basics'})
    if kc:
        kc_id = str(kc['_id'])

        status = engine.bkt.get_mastery_status(learner_id, kc_id)
        print(f"KC: {kc['name']}")
        print(f"Status: {status['status']}")
        print(f"Mastery Probability: {status['p_mastery']:.1%}")
        print(f"Total Attempts: {status['total_attempts']}")
        print(f"Correct Count: {status['correct_count']}")

        p_correct = engine.bkt.predict_correctness(learner_id, kc_id)
        print(f"Predicted P(correct): {p_correct:.1%}")

    # Demo FSRS
    print("\n📅 FSRS Spaced Repetition")
    print("-" * 40)

    due = engine.fsrs.get_due_reviews(learner_id)
    print(f"Reviews due now: {len(due)}")

    upcoming = engine.fsrs.get_upcoming_reviews(learner_id, days_ahead=7)
    print(f"Reviews in next 7 days: {len(upcoming)}")

    if kc:
        retention = engine.fsrs.get_retention_rate(learner_id, kc_id)
        print(f"Current retention for {kc['name']}: {retention:.1%}")

    # Demo IRT
    print("\n📐 Item Response Theory (IRT)")
    print("-" * 40)

    theta = engine.irt.estimate_ability(learner_id)
    print(f"Learner ability (theta): {theta:.2f}")

    distribution = engine.irt.get_ability_distribution()
    print(f"Population mean ability: {distribution['mean']:.2f}")
    print(f"Population std dev: {distribution['std']:.2f}")

    # Get an item
    item = db.collections.learning_items.find_one()
    if item:
        item_id = str(item['_id'])
        analysis = engine.irt.get_item_analysis(item_id)
        print(f"\nItem Analysis:")
        print(f"  Difficulty: {analysis['difficulty']:.2f}")
        print(f"  Discrimination: {analysis['discrimination']:.2f}")
        print(f"  P-value: {analysis['p_value']:.1%}")
        print(f"  Responses: {analysis['total_responses']}")

    print("\n✅ Individual services demo complete\n")


if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == '--services':
        demo_individual_services()
    else:
        demo_learning_session()
