#!/usr/bin/env python3
"""
API Testing Script for Phase 3 Adaptive Learning Endpoints

This script demonstrates how to interact with the adaptive learning API.
Run the Flask server first: python app.py
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000/api/adaptive"
LEARNER_EMAIL = "maria.garcia@example.com"


def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)


def print_json(data, indent=2):
    """Pretty print JSON data"""
    print(json.dumps(data, indent=indent, default=str))


def get_learner_id():
    """Get learner ID from database"""
    from database import Database
    db = Database()
    if not db.is_connected:
        print("❌ Database not connected")
        return None

    learner = db.collections.get_learner_by_email(LEARNER_EMAIL)
    if not learner:
        print(f"❌ Learner {LEARNER_EMAIL} not found. Run seed_data.py first.")
        return None

    return str(learner['_id'])


def test_health_check():
    """Test health check endpoint"""
    print_section("1. Health Check")

    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status Code: {response.status_code}")
        print_json(response.json())

        if response.status_code == 200:
            print("✅ Service is healthy")
            return True
        else:
            print("❌ Service is unhealthy")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Is Flask running?")
        print("   Run: python app.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_get_kcs():
    """Test get knowledge components endpoint"""
    print_section("2. Get Knowledge Components")

    try:
        # Get all KCs
        response = requests.get(f"{BASE_URL}/kcs")
        print(f"Status Code: {response.status_code}")

        data = response.json()
        print(f"\nTotal KCs: {len(data['kcs'])}")

        for kc in data['kcs'][:3]:  # Show first 3
            print(f"\n  • {kc['name']}")
            print(f"    Domain: {kc['domain']}")
            print(f"    Difficulty Tier: {kc['difficulty_tier']}")
            print(f"    Est. Minutes: {kc['estimated_minutes']}")

        # Get filtered KCs
        print("\n\nFiltering by domain='credit':")
        response = requests.get(f"{BASE_URL}/kcs?domain=credit")
        data = response.json()
        print(f"Credit KCs: {len(data['kcs'])}")

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_get_progress(learner_id):
    """Test get progress endpoint"""
    print_section("3. Get Learner Progress")

    try:
        response = requests.get(f"{BASE_URL}/progress/{learner_id}")
        print(f"Status Code: {response.status_code}")

        if response.status_code != 200:
            print(f"❌ Error: {response.json().get('error')}")
            return False

        data = response.json()

        print(f"\n📊 Learner: {data['learner']['display_name']}")
        print(f"   Total XP: {data['learner']['total_xp']}")
        print(f"   Streak: {data['learner']['streak_count']} days")
        print(f"   Ability: {data['learner']['estimated_ability']:.2f}")

        overview = data['overview']
        print(f"\n📚 Skills Overview:")
        print(f"   Total: {overview['total_kcs']}")
        print(f"   Mastered: {overview['mastered']}")
        print(f"   In Progress: {overview['in_progress']}")
        print(f"   Available: {overview['available']}")
        print(f"   Locked: {overview['locked']}")
        print(f"   Avg Mastery: {overview['avg_mastery']:.1%}")

        print(f"\n🎯 Skills Detail:")
        for skill in data['skills'][:5]:  # Show first 5
            status_icon = {
                'mastered': '✅',
                'in_progress': '🔄',
                'available': '🆕',
                'locked': '🔒'
            }.get(skill.get('status'), '⚪')

            print(f"   {status_icon} {skill['kc_name']}")
            print(f"      Mastery: {skill.get('p_mastery', 0):.1%}")
            print(f"      Attempts: {skill.get('total_attempts', 0)}")

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_learning_path(learner_id):
    """Test learning path endpoint"""
    print_section("4. Get Learning Path")

    try:
        response = requests.get(f"{BASE_URL}/learning-path/{learner_id}")
        print(f"Status Code: {response.status_code}")

        if response.status_code != 200:
            print(f"❌ Error: {response.json().get('error')}")
            return False

        data = response.json()
        path = data['path']

        print(f"\n🗺️  Recommended Learning Path ({len(path)} items):\n")

        for i, step in enumerate(path, 1):
            priority_icon = {
                'high': '🔴',
                'medium': '🟡',
                'low': '🟢'
            }.get(step['priority'], '⚪')

            print(f"{i}. {priority_icon} {step['kc_name']}")
            print(f"   Reason: {step['reason']}")
            print(f"   Priority: {step['priority']}")

            if 'p_mastery' in step:
                print(f"   Current Mastery: {step['p_mastery']:.1%}")
            if 'retrievability' in step:
                print(f"   Retrievability: {step['retrievability']:.1%}")

            print()

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_reviews(learner_id):
    """Test review schedule endpoint"""
    print_section("5. Get Review Schedule")

    try:
        response = requests.get(f"{BASE_URL}/reviews/{learner_id}?days_ahead=7")
        print(f"Status Code: {response.status_code}")

        if response.status_code != 200:
            print(f"❌ Error: {response.json().get('error')}")
            return False

        data = response.json()

        print(f"\n📅 Review Schedule:")
        print(f"   Due Now: {data['due_now']}")
        print(f"   Upcoming (7 days): {data['total_upcoming']}")

        if data['due_items']:
            print(f"\n   Most Urgent Reviews:")
            for review in data['due_items'][:3]:
                print(f"      • KC {review['kc_id'][:8]}...")
                print(f"        Overdue: {review['days_overdue']:.1f} days")
                print(f"        Retrievability: {review['retrievability']:.1%}")

        if data['upcoming']:
            print(f"\n   Upcoming Reviews:")
            for review in data['upcoming'][:3]:
                print(f"      • KC {review['kc_id'][:8]}...")
                print(f"        In {review['days_until']} days")
                print(f"        Review count: {review['review_count']}")

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_start_session(learner_id):
    """Test start session endpoint"""
    print_section("6. Start Learning Session")

    try:
        payload = {
            "learner_id": learner_id,
            "session_length": 3
        }

        print(f"Request:")
        print_json(payload)

        response = requests.post(
            f"{BASE_URL}/sessions/start",
            json=payload,
            headers={"Content-Type": "application/json"}
        )

        print(f"\nStatus Code: {response.status_code}")

        if response.status_code != 200:
            print(f"❌ Error: {response.json().get('error')}")
            return None

        data = response.json()

        print(f"\n✅ Session Created: {data['session_id']}")
        print(f"   Items: {len(data['items'])}")

        for i, item in enumerate(data['items'], 1):
            print(f"\n   Question {i}:")
            print(f"      KC: {item['kc_name']} ({item['kc_domain']})")
            print(f"      Type: {item['item_type']}")
            print(f"      Predicted Difficulty: {item['predicted_p_correct']:.1%}")

            if item['item_type'] == 'multiple_choice':
                content = item['content']
                print(f"\n      {content['stem']}")
                for idx, choice in enumerate(content['choices']):
                    print(f"         {idx}. {choice}")

        return data

    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def test_submit_interaction(learner_id, session_data):
    """Test submit interaction endpoint"""
    print_section("7. Submit Interaction")

    if not session_data or not session_data['items']:
        print("❌ No session data available")
        return False

    try:
        # Use first item from session
        item = session_data['items'][0]
        correct_answer = item['content'].get('correct_answer', 0)

        payload = {
            "learner_id": learner_id,
            "item_id": item['item_id'],
            "kc_id": item['kc_id'],
            "session_id": session_data['session_id'],
            "is_correct": True,  # Simulating correct answer
            "response_value": {"selected_choice": correct_answer},
            "response_time_ms": 12000,
            "hint_used": False
        }

        print(f"Submitting answer for: {item['kc_name']}")
        print(f"Item ID: {item['item_id']}")
        print(f"Simulating correct answer...")

        response = requests.post(
            f"{BASE_URL}/interactions",
            json=payload,
            headers={"Content-Type": "application/json"}
        )

        print(f"\nStatus Code: {response.status_code}")

        if response.status_code != 200:
            print(f"❌ Error: {response.json().get('error')}")
            return False

        data = response.json()

        print(f"\n✅ Interaction Logged: {data['interaction_id']}")

        skill = data['skill_state']
        print(f"\n📊 Skill State Updated:")
        print(f"   Mastery: {skill['p_mastery_before']:.1%} → {skill['p_mastery']:.1%}")
        print(f"   Change: {skill['mastery_change']:+.1%}")
        print(f"   Status: {skill['status']}")
        print(f"   Next Review: {skill['next_review_at']}")

        print(f"\n🎁 Rewards:")
        print(f"   XP Earned: +{data['xp_earned']}")

        if data['achievements']:
            print(f"\n🏆 New Achievements Unlocked:")
            for ach in data['achievements']:
                print(f"   • {ach['name']}")
                print(f"     {ach['description']}")
                print(f"     +{ach['xp_reward']} XP")

        # Show explanation
        if 'explanation' in item['content']:
            print(f"\n💡 Explanation:")
            print(f"   {item['content']['explanation']}")

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_get_analytics(learner_id):
    """Test analytics endpoint"""
    print_section("8. Get Analytics")

    try:
        response = requests.get(f"{BASE_URL}/analytics/{learner_id}")
        print(f"Status Code: {response.status_code}")

        if response.status_code != 200:
            print(f"❌ Error: {response.json().get('error')}")
            return False

        data = response.json()

        print(f"\n📈 Analytics Dashboard")
        print(f"\n👤 Learner: {data['display_name']}")
        print(f"   Total XP: {data['total_xp']}")
        print(f"   Streak: {data['streak_count']} days")
        print(f"   Recent Accuracy: {data['recent_accuracy']:.1%}")
        print(f"   Estimated Ability: {data['estimated_ability']:.2f}")
        print(f"   Total Interactions: {data['total_interactions']}")

        if data['daily_progress']:
            print(f"\n📅 Recent Daily Progress:")
            for day in data['daily_progress'][:3]:
                print(f"   • {day.get('date', 'N/A')}")
                print(f"     XP: {day.get('xp_earned', 0)}")
                print(f"     Lessons: {day.get('lessons_completed', 0)}")
                print(f"     Minutes: {day.get('minutes_practiced', 0)}")

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Run all API tests"""
    print_section("ADAPTIVE LEARNING API TEST SUITE")
    print(f"\nBase URL: {BASE_URL}")
    print(f"Learner: {LEARNER_EMAIL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Get learner ID
    learner_id = get_learner_id()
    if not learner_id:
        print("\n❌ Cannot proceed without learner ID")
        print("   Please run: python seed_data.py")
        return

    print(f"\n✅ Learner ID: {learner_id}")

    # Run tests
    tests = [
        ("Health Check", lambda: test_health_check()),
        ("Get KCs", lambda: test_get_kcs()),
        ("Get Progress", lambda: test_get_progress(learner_id)),
        ("Learning Path", lambda: test_learning_path(learner_id)),
        ("Review Schedule", lambda: test_reviews(learner_id)),
        ("Analytics", lambda: test_get_analytics(learner_id)),
    ]

    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
            time.sleep(0.5)  # Brief pause between tests
        except Exception as e:
            print(f"\n❌ Test '{name}' failed: {e}")
            results.append((name, False))

    # Session and interaction tests (more complex)
    session_data = test_start_session(learner_id)
    results.append(("Start Session", session_data is not None))

    if session_data:
        time.sleep(0.5)
        interaction_result = test_submit_interaction(learner_id, session_data)
        results.append(("Submit Interaction", interaction_result))

    # Summary
    print_section("TEST SUMMARY")
    passed = sum(1 for _, result in results if result)
    total = len(results)

    print(f"\nResults: {passed}/{total} tests passed\n")

    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}  {name}")

    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")

    print("\n")


if __name__ == '__main__':
    main()
