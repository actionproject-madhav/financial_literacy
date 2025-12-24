"""
Test the complete adaptive learning loop.

This script tests the full flow:
1. Create/get a test learner
2. Start a learning session
3. Answer questions with varying correctness
4. Check mastery updates
5. Verify achievements
6. Check final progress

Usage:
    python scripts/test_full_loop.py
"""

import requests
import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import Database
from bson import ObjectId
from services import LearningEngine

BASE_URL = 'http://localhost:5000/api'


def create_test_learner():
    """Create a test learner in the database."""
    print("\n" + "=" * 60)
    print("CREATING TEST LEARNER")
    print("=" * 60)

    db = Database()

    if not db.is_connected:
        print("❌ Database not connected")
        return None

    # Create test learner
    test_email = f"test_learner_{datetime.now().timestamp()}@example.com"

    learner_id = db.collections.create_learner(
        email=test_email,
        display_name="Test Learner",
        native_language="Spanish",
        english_proficiency="intermediate",
        country_of_origin="MEX",
        immigration_status="F1",
        visa_type="F1",
        has_ssn=False,
        sends_remittances=False,
        financial_goals=["emergency_fund", "credit_building"],
        financial_experience_level="novice",
        daily_goal_minutes=15,
        timezone="America/New_York"
    )

    print(f"✅ Created test learner: {learner_id}")
    print(f"   Email: {test_email}")

    # Initialize learner's skill states
    engine = LearningEngine(db.collections)
    initialized = engine.initialize_learner_kcs(learner_id)
    print(f"✅ Initialized {initialized} knowledge components for test learner")

    return learner_id


def test_full_loop(learner_id):
    """Test the complete learning loop."""
    print("\n" + "=" * 60)
    print("TESTING FULL ADAPTIVE LEARNING LOOP")
    print("=" * 60)

    # Step 1: Start session
    print("\n1️⃣  Starting learning session...")
    try:
        res = requests.post(f'{BASE_URL}/adaptive/sessions/start', json={
            'learner_id': learner_id,
            'session_length': 5
        })

        if res.status_code != 200:
            print(f"❌ Failed to start session: {res.text}")
            return False

        session = res.json()
        session_id = session['session_id']
        items = session['items']

        print(f"✅ Session started: {session_id}")
        print(f"   Got {len(items)} items to practice")

        if len(items) == 0:
            print("⚠️  No items returned. Make sure database is seeded!")
            return False

    except Exception as e:
        print(f"❌ Error starting session: {e}")
        return False

    # Step 2: Answer questions
    print("\n2️⃣  Answering questions...")
    print("-" * 60)

    xp_earned_total = 0

    for i, item in enumerate(items):
        # Simulate answering (alternating correct/wrong for testing)
        is_correct = i % 2 == 0

        try:
            res = requests.post(f'{BASE_URL}/adaptive/interactions', json={
                'learner_id': learner_id,
                'item_id': item['item_id'],
                'kc_id': item['kc_id'],
                'session_id': session_id,
                'is_correct': is_correct,
                'response_value': {'selected_choice': 0 if is_correct else 1},
                'response_time_ms': 3000 + (i * 500)
            })

            if res.status_code != 200:
                print(f"❌ Failed to log interaction: {res.text}")
                continue

            result = res.json()
            skill_state = result['skill_state']
            xp_earned = result.get('xp_earned', 0)
            achievements = result.get('achievements', [])

            xp_earned_total += xp_earned

            print(f"\nQuestion {i+1}/{len(items)}")
            print(f"  Skill: {item['kc_name']}")
            print(f"  Answer: {'✓ Correct' if is_correct else '✗ Incorrect'}")
            print(f"  Mastery: {skill_state['p_mastery']:.3f} (Δ {skill_state.get('mastery_change', 0):+.3f})")
            print(f"  XP Earned: +{xp_earned}")

            if achievements:
                print(f"  🎉 Achievements: {', '.join([a['name'] for a in achievements])}")

        except Exception as e:
            print(f"❌ Error logging interaction {i+1}: {e}")
            continue

    print(f"\n{'=' * 60}")
    print(f"Total XP Earned: {xp_earned_total}")
    print(f"{'=' * 60}")

    # Step 3: Check progress
    print("\n3️⃣  Checking final progress...")
    try:
        res = requests.get(f'{BASE_URL}/adaptive/progress/{learner_id}')

        if res.status_code != 200:
            print(f"❌ Failed to get progress: {res.text}")
            return False

        progress = res.json()
        learner = progress['learner']
        overview = progress['overview']

        print(f"\n📊 Learner Progress:")
        print(f"   Name: {learner['display_name']}")
        print(f"   Total XP: {learner['total_xp']}")
        print(f"   Estimated Ability: {learner['estimated_ability']:.3f}")

        print(f"\n📈 Skills Overview:")
        print(f"   Total Skills: {overview['total_kcs']}")
        print(f"   Mastered: {overview['mastered']}")
        print(f"   In Progress: {overview['in_progress']}")
        print(f"   Available: {overview['available']}")
        print(f"   Locked: {overview['locked']}")
        print(f"   Average Mastery: {overview['avg_mastery']:.3f}")

        print(f"\n🎯 Skills Practiced:")
        for skill in progress['skills'][:10]:  # Show first 10
            print(f"   • {skill['name']}: {skill['p_mastery']:.3f} ({skill['status']})")

    except Exception as e:
        print(f"❌ Error getting progress: {e}")
        return False

    # Step 4: Check achievements
    print("\n4️⃣  Checking achievements...")
    try:
        res = requests.get(f'{BASE_URL}/adaptive/achievements/{learner_id}')

        if res.status_code != 200:
            print(f"❌ Failed to get achievements: {res.text}")
            return False

        achievements_data = res.json()
        achievements = achievements_data.get('achievements', [])

        if achievements:
            print(f"\n🏆 Earned Achievements ({len(achievements)}):")
            for ach in achievements:
                print(f"   {ach.get('icon_url', '🏅')} {ach['name']} - {ach['xp_reward']} XP")
                print(f"      {ach['description']}")
        else:
            print("\n   No achievements earned yet")

        # Check available achievements
        res = requests.get(f'{BASE_URL}/adaptive/achievements/{learner_id}/available')
        if res.status_code == 200:
            available = res.json().get('achievements', [])
            print(f"\n📋 Available Achievements ({len(available)}):")
            for ach in available[:5]:  # Show first 5
                progress_val = ach.get('progress', 0)
                threshold = ach.get('threshold', 1)
                percent = (progress_val / threshold * 100) if threshold > 0 else 0
                print(f"   {ach.get('icon_url', '🎯')} {ach['name']}: {progress_val}/{threshold} ({percent:.0f}%)")

    except Exception as e:
        print(f"❌ Error getting achievements: {e}")
        return False

    # Step 5: Test next item recommendation
    print("\n5️⃣  Testing next item recommendation...")
    try:
        res = requests.get(f'{BASE_URL}/adaptive/next-item', params={
            'learner_id': learner_id
        })

        if res.status_code == 200:
            next_item = res.json()
            print(f"\n🎯 Recommended Next Item:")
            print(f"   Skill: {next_item['kc_name']}")
            print(f"   Domain: {next_item['kc_domain']}")
            print(f"   Predicted Accuracy: {next_item['predicted_p_correct']:.2f}")
            print(f"   Current Mastery: {next_item['p_mastery']:.3f}")
            print(f"   Is Review: {'Yes' if next_item['is_review'] else 'No'}")
        else:
            print(f"⚠️  No next item available")

    except Exception as e:
        print(f"❌ Error getting next item: {e}")

    print("\n" + "=" * 60)
    print("✅ FULL LOOP TEST COMPLETED SUCCESSFULLY")
    print("=" * 60 + "\n")

    return True


def test_personalization(learner_id):
    """Test personalization features."""
    print("\n" + "=" * 60)
    print("TESTING PERSONALIZATION FEATURES")
    print("=" * 60)

    # Get a sample item
    try:
        res = requests.get(f'{BASE_URL}/adaptive/next-item', params={
            'learner_id': learner_id
        })

        if res.status_code != 200:
            print("⚠️  No item available for personalization test")
            return

        item = res.json()
        item_id = item['item_id']

        # Test hint
        print("\n1️⃣  Testing hint generation...")
        res = requests.post(f'{BASE_URL}/adaptive/hint', json={
            'learner_id': learner_id,
            'item_id': item_id
        })

        if res.status_code == 200:
            hint_data = res.json()
            print(f"✅ Hint: {hint_data.get('hint', 'N/A')[:100]}...")
        else:
            print(f"⚠️  Hint generation failed: {res.text}")

        # Test wrong answer explanation
        print("\n2️⃣  Testing wrong answer explanation...")
        res = requests.post(f'{BASE_URL}/adaptive/explain-wrong', json={
            'learner_id': learner_id,
            'item_id': item_id,
            'learner_answer': 0
        })

        if res.status_code == 200:
            explain_data = res.json()
            print(f"✅ Explanation: {explain_data.get('explanation', 'N/A')[:100]}...")
            print(f"   Encouragement: {explain_data.get('encouragement', 'N/A')[:100]}...")
        else:
            print(f"⚠️  Explanation generation failed: {res.text}")

    except Exception as e:
        print(f"❌ Error testing personalization: {e}")


def main():
    """Main test runner."""
    print("\n" + "=" * 60)
    print("  ADAPTIVE LEARNING SYSTEM - FULL INTEGRATION TEST")
    print("=" * 60)

    # Check if server is running
    print("\n🔍 Checking if server is running...")
    try:
        res = requests.get(f'{BASE_URL}/adaptive/health')
        if res.status_code == 200:
            print("✅ Server is running")
        else:
            print("❌ Server health check failed")
            return
    except Exception as e:
        print(f"❌ Cannot connect to server at {BASE_URL}")
        print(f"   Error: {e}")
        print("\n💡 Make sure the Flask server is running:")
        print("   python app.py")
        return

    # Check if database is seeded
    print("\n🔍 Checking if database is seeded...")
    try:
        res = requests.get(f'{BASE_URL}/adaptive/kcs')
        if res.status_code == 200:
            kcs = res.json().get('kcs', [])
            if len(kcs) == 0:
                print("⚠️  No knowledge components found!")
                print("\n💡 Run seed scripts first:")
                print("   python scripts/seed_all.py")
                return
            print(f"✅ Found {len(kcs)} knowledge components")
        else:
            print("❌ Failed to check knowledge components")
            return
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return

    # Create test learner
    learner_id = create_test_learner()
    if not learner_id:
        print("\n❌ Failed to create test learner")
        return

    # Run tests
    success = test_full_loop(learner_id)

    if success:
        test_personalization(learner_id)

    print("\n" + "=" * 60)
    print("  TEST COMPLETE")
    print("=" * 60)
    print(f"\n📝 Test learner ID: {learner_id}")
    print(f"   You can view this learner's data using the API")
    print(f"   GET {BASE_URL}/learners/{learner_id}")
    print("\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Test interrupted by user\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
