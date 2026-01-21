"""
Referral System End-to-End Test

Tests the complete referral flow:
1. User A gets their referral code
2. User B signs up using User A's referral link
3. Both users receive 100 XP
4. Referral is recorded in the database
"""

import requests
import json

# Configuration
API_BASE = "http://localhost:5000"
FRONTEND_BASE = "http://localhost:5173"

def test_referral_system():
    print("=" * 60)
    print("REFERRAL SYSTEM END-TO-END TEST")
    print("=" * 60)

    # Step 1: Get or create User A (referrer)
    print("\n1. Setting up User A (Referrer)...")
    print("-" * 60)

    # For this test, we'll assume you have a learner ID for User A
    # Replace with an actual learner ID from your database
    user_a_id = input("Enter User A's learner_id (referrer): ").strip()

    if not user_a_id:
        print("❌ Error: User A ID is required")
        return

    # Step 2: Get User A's referral code
    print("\n2. Getting User A's referral code...")
    print("-" * 60)

    try:
        response = requests.get(f"{API_BASE}/api/social/referral/code/{user_a_id}")
        response.raise_for_status()
        data = response.json()

        referral_code = data['referral_code']
        referral_link = data['referral_link']
        initial_referrals = data['total_referrals']

        print(f"✓ Referral Code: {referral_code}")
        print(f"✓ Referral Link: {referral_link}")
        print(f"✓ Current Total Referrals: {initial_referrals}")

    except Exception as e:
        print(f"❌ Error getting referral code: {e}")
        return

    # Step 3: Get User A's current XP
    print("\n3. Getting User A's current XP...")
    print("-" * 60)

    try:
        response = requests.get(f"{API_BASE}/api/learners/{user_a_id}/stats")
        response.raise_for_status()
        user_a_stats = response.json()
        user_a_initial_xp = user_a_stats['total_xp']

        print(f"✓ User A Initial XP: {user_a_initial_xp}")

    except Exception as e:
        print(f"❌ Error getting User A stats: {e}")
        return

    # Step 4: Simulate User B signup
    print("\n4. Simulating User B (Referee) signup...")
    print("-" * 60)

    user_b_id = input("Enter User B's learner_id (referee/new user): ").strip()

    if not user_b_id:
        print("❌ Error: User B ID is required")
        return

    if user_b_id == user_a_id:
        print("❌ Error: User A and User B cannot be the same")
        return

    # Step 5: Get User B's current XP (before referral)
    print("\n5. Getting User B's current XP (before referral)...")
    print("-" * 60)

    try:
        response = requests.get(f"{API_BASE}/api/learners/{user_b_id}/stats")
        response.raise_for_status()
        user_b_stats = response.json()
        user_b_initial_xp = user_b_stats['total_xp']

        print(f"✓ User B Initial XP: {user_b_initial_xp}")

    except Exception as e:
        print(f"❌ Error getting User B stats: {e}")
        return

    # Step 6: Track the referral
    print("\n6. Tracking the referral (User B used User A's code)...")
    print("-" * 60)

    try:
        response = requests.post(
            f"{API_BASE}/api/social/referral/track",
            json={
                "referral_code": referral_code,
                "referred_user_id": user_b_id
            },
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        track_data = response.json()

        print(f"✓ Referral tracked successfully!")
        print(f"✓ Referrer ID: {track_data['referrer_id']}")
        print(f"✓ Reward XP: {track_data['reward_xp']}")
        print(f"✓ Message: {track_data.get('message', 'N/A')}")

    except Exception as e:
        print(f"❌ Error tracking referral: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Response: {e.response.text}")
        return

    # Step 7: Verify User A's XP increased
    print("\n7. Verifying User A received XP...")
    print("-" * 60)

    try:
        response = requests.get(f"{API_BASE}/api/learners/{user_a_id}/stats")
        response.raise_for_status()
        user_a_new_stats = response.json()
        user_a_new_xp = user_a_new_stats['total_xp']
        user_a_xp_gain = user_a_new_xp - user_a_initial_xp

        print(f"✓ User A Initial XP: {user_a_initial_xp}")
        print(f"✓ User A New XP: {user_a_new_xp}")
        print(f"✓ User A XP Gain: {user_a_xp_gain}")

        if user_a_xp_gain == 100:
            print("✓ SUCCESS: User A received 100 XP!")
        else:
            print(f"❌ WARNING: Expected 100 XP, got {user_a_xp_gain} XP")

    except Exception as e:
        print(f"❌ Error verifying User A XP: {e}")

    # Step 8: Verify User B's XP increased
    print("\n8. Verifying User B received XP...")
    print("-" * 60)

    try:
        response = requests.get(f"{API_BASE}/api/learners/{user_b_id}/stats")
        response.raise_for_status()
        user_b_new_stats = response.json()
        user_b_new_xp = user_b_new_stats['total_xp']
        user_b_xp_gain = user_b_new_xp - user_b_initial_xp

        print(f"✓ User B Initial XP: {user_b_initial_xp}")
        print(f"✓ User B New XP: {user_b_new_xp}")
        print(f"✓ User B XP Gain: {user_b_xp_gain}")

        if user_b_xp_gain == 100:
            print("✓ SUCCESS: User B received 100 XP!")
        else:
            print(f"❌ WARNING: Expected 100 XP, got {user_b_xp_gain} XP")

    except Exception as e:
        print(f"❌ Error verifying User B XP: {e}")

    # Step 9: Verify referral count increased
    print("\n9. Verifying referral count increased...")
    print("-" * 60)

    try:
        response = requests.get(f"{API_BASE}/api/social/referral/code/{user_a_id}")
        response.raise_for_status()
        data = response.json()
        new_total_referrals = data['total_referrals']

        print(f"✓ Initial Referrals: {initial_referrals}")
        print(f"✓ New Total Referrals: {new_total_referrals}")

        if new_total_referrals == initial_referrals + 1:
            print("✓ SUCCESS: Referral count increased!")
        else:
            print(f"❌ WARNING: Expected {initial_referrals + 1}, got {new_total_referrals}")

    except Exception as e:
        print(f"❌ Error checking referral count: {e}")

    # Step 10: Get referral list
    print("\n10. Getting User A's referral list...")
    print("-" * 60)

    try:
        response = requests.get(f"{API_BASE}/api/social/referrals/{user_a_id}")
        response.raise_for_status()
        referrals_data = response.json()

        print(f"✓ Total Referrals: {referrals_data['total_referrals']}")
        print(f"✓ Total Rewards Earned: {referrals_data['total_rewards_earned']} XP")

        if referrals_data['referrals']:
            print(f"\n   Recent Referrals:")
            for ref in referrals_data['referrals'][:5]:
                print(f"   - {ref['display_name']} ({ref['total_xp']} XP) - Joined: {ref['joined_at'][:10]}")

    except Exception as e:
        print(f"❌ Error getting referral list: {e}")

    # Final Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Referral Code: {referral_code}")
    print(f"Referrer (User A): {user_a_id}")
    print(f"Referee (User B): {user_b_id}")
    print(f"User A XP Gain: +{user_a_xp_gain} XP")
    print(f"User B XP Gain: +{user_b_xp_gain} XP")
    print(f"Referral Count: {initial_referrals} → {new_total_referrals}")
    print("=" * 60)

    if user_a_xp_gain == 100 and user_b_xp_gain == 100 and new_total_referrals == initial_referrals + 1:
        print("✅ ALL TESTS PASSED! Referral system working correctly!")
    else:
        print("⚠️  Some tests had warnings. Check the output above.")
    print("=" * 60)


if __name__ == "__main__":
    test_referral_system()
