"""
Test script for Placement Test endpoints

This script demonstrates:
1. Starting a placement test
2. Simulating learner responses
3. Completing the placement test
4. Verifying skill initialization

Requirements:
- Flask app running on http://localhost:5000
- Database seeded with skills and questions
- Valid learner_id
"""

import requests
import random
import json
from time import sleep

BASE_URL = "http://localhost:5000/api/adaptive"


def test_placement_test(learner_id):
    """
    Run a complete placement test flow.

    Args:
        learner_id: MongoDB ObjectId string of the learner
    """
    print("=" * 60)
    print("PLACEMENT TEST - START")
    print("=" * 60)

    # Step 1: Start placement test
    print("\n1. Starting placement test...")
    response = requests.post(
        f"{BASE_URL}/placement-test/start",
        json={"learner_id": learner_id}
    )

    if response.status_code != 200:
        print(f"❌ Error starting test: {response.json()}")
        return

    test_data = response.json()
    test_id = test_data['test_id']
    items = test_data['items']

    print(f"✅ Test started: {test_id}")
    print(f"   Total items: {test_data['total_items']}")
    print(f"   Difficulty distribution:")

    tier_counts = {}
    for item in items:
        tier = item.get('difficulty_tier', 1)
        tier_counts[tier] = tier_counts.get(tier, 0) + 1

    for tier in sorted(tier_counts.keys()):
        print(f"      Tier {tier}: {tier_counts[tier]} questions")

    # Step 2: Display questions and simulate answers
    print("\n2. Processing questions...")
    print("-" * 60)

    results = []

    for i, item in enumerate(items, 1):
        content = item['content']
        print(f"\nQuestion {i}/{len(items)}")
        print(f"Domain: {item['kc_domain']} | Skill: {item['kc_name']}")
        print(f"Difficulty: Tier {item.get('difficulty_tier', 1)}")
        print(f"\n{content.get('stem', 'No question text')}")

        choices = content.get('choices', [])
        for idx, choice in enumerate(choices):
            print(f"  {idx}. {choice}")

        # Simulate learner response
        # For testing, randomly choose with 70% accuracy
        correct_answer = content.get('correct_answer', 0)

        # Simulate realistic response times (10-30 seconds)
        response_time_ms = random.randint(10000, 30000)

        # 70% chance of correct answer for simulation
        if random.random() < 0.7:
            selected_choice = correct_answer
            is_correct = True
        else:
            # Choose a wrong answer
            wrong_choices = [idx for idx in range(len(choices)) if idx != correct_answer]
            selected_choice = random.choice(wrong_choices) if wrong_choices else 0
            is_correct = False

        print(f"\n>>> Learner selected: {selected_choice}")
        print(f">>> {'✓ Correct!' if is_correct else '✗ Incorrect'}")

        results.append({
            "item_id": item['item_id'],
            "kc_id": item['kc_id'],
            "is_correct": is_correct,
            "response_time_ms": response_time_ms,
            "response_value": {"selected_choice": selected_choice}
        })

        sleep(0.5)  # Brief pause for readability

    # Step 3: Complete placement test
    print("\n" + "=" * 60)
    print("3. Completing placement test...")
    print("=" * 60)

    response = requests.post(
        f"{BASE_URL}/placement-test/complete",
        json={
            "learner_id": learner_id,
            "test_id": test_id,
            "results": results
        }
    )

    if response.status_code != 200:
        print(f"❌ Error completing test: {response.json()}")
        return

    result = response.json()

    # Display results
    print(f"\n{'=' * 60}")
    print("PLACEMENT TEST RESULTS")
    print(f"{'=' * 60}")
    print(f"\n📊 Score: {result['correct_count']}/{result['total_items']} ({result['score']*100:.0f}%)")
    print(f"🎯 Performance Level: {result['performance_level'].upper()}")
    print(f"✨ Skills Initialized: {result['skills_initialized']}")
    print(f"\n💬 {result['message']}")
    print(f"\n{'=' * 60}")

    # Step 4: Verify skill states were created
    print("\n4. Verifying skill initialization...")

    # Check learner's skills
    learner_response = requests.get(
        f"http://localhost:5000/api/learners/{learner_id}/skills"
    )

    if learner_response.status_code == 200:
        skills_data = learner_response.json()
        skills = skills_data.get('skills', [])

        print(f"\n✅ Found {len(skills)} initialized skills")

        # Group by status
        status_counts = {}
        for skill in skills:
            status = skill['status']
            status_counts[status] = status_counts.get(status, 0) + 1

        print(f"\nSkill Status Breakdown:")
        for status, count in sorted(status_counts.items()):
            print(f"   {status}: {count}")

        # Show sample skills
        print(f"\nSample Skills (first 5):")
        for skill in skills[:5]:
            print(f"   • {skill['name']}")
            print(f"     Status: {skill['status']} | Mastery: {skill['p_mastery']:.2f}")
    else:
        print("⚠️  Could not verify skills")

    print(f"\n{'=' * 60}")
    print("✅ PLACEMENT TEST COMPLETE")
    print(f"{'=' * 60}\n")

    return result


def test_with_specific_performance(learner_id, target_accuracy=0.8):
    """
    Run placement test with controlled accuracy.

    Args:
        learner_id: MongoDB ObjectId string
        target_accuracy: Desired accuracy (0.0 to 1.0)
    """
    print(f"\nRunning controlled test with {target_accuracy*100:.0f}% target accuracy\n")

    # Start test
    response = requests.post(
        f"{BASE_URL}/placement-test/start",
        json={"learner_id": learner_id}
    )

    if response.status_code != 200:
        print(f"Error: {response.json()}")
        return

    test_data = response.json()
    test_id = test_data['test_id']
    items = test_data['items']

    results = []

    for item in items:
        content = item['content']
        correct_answer = content.get('correct_answer', 0)
        choices = content.get('choices', [])

        # Answer correctly based on target accuracy
        if random.random() < target_accuracy:
            selected_choice = correct_answer
            is_correct = True
        else:
            wrong_choices = [idx for idx in range(len(choices)) if idx != correct_answer]
            selected_choice = random.choice(wrong_choices) if wrong_choices else 0
            is_correct = False

        results.append({
            "item_id": item['item_id'],
            "kc_id": item['kc_id'],
            "is_correct": is_correct,
            "response_time_ms": random.randint(10000, 30000),
            "response_value": {"selected_choice": selected_choice}
        })

    # Complete test
    response = requests.post(
        f"{BASE_URL}/placement-test/complete",
        json={
            "learner_id": learner_id,
            "test_id": test_id,
            "results": results
        }
    )

    if response.status_code == 200:
        result = response.json()
        print(f"Target: {target_accuracy*100:.0f}% | Actual: {result['score']*100:.0f}%")
        print(f"Performance Level: {result['performance_level']}")
        print(f"Skills Initialized: {result['skills_initialized']}")
    else:
        print(f"Error: {response.json()}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python test_placement.py <learner_id> [mode]")
        print()
        print("Modes:")
        print("  full    - Full interactive test (default)")
        print("  novice  - Simulate novice learner (20% accuracy)")
        print("  beginner - Simulate beginner learner (50% accuracy)")
        print("  intermediate - Simulate intermediate learner (70% accuracy)")
        print("  advanced - Simulate advanced learner (90% accuracy)")
        print()
        print("Example:")
        print("  python test_placement.py 507f1f77bcf86cd799439011 full")
        print("  python test_placement.py 507f1f77bcf86cd799439011 advanced")
        sys.exit(1)

    learner_id = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else "full"

    if mode == "full":
        test_placement_test(learner_id)
    elif mode == "novice":
        test_with_specific_performance(learner_id, 0.2)
    elif mode == "beginner":
        test_with_specific_performance(learner_id, 0.5)
    elif mode == "intermediate":
        test_with_specific_performance(learner_id, 0.7)
    elif mode == "advanced":
        test_with_specific_performance(learner_id, 0.9)
    else:
        print(f"Unknown mode: {mode}")
        sys.exit(1)
