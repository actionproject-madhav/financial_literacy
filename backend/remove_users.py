#!/usr/bin/env python3
"""
Script to remove users from the database for testing onboarding
"""
import sys
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
import os

load_dotenv()

def connect_db():
    """Connect to MongoDB"""
    mongo_uri = os.getenv('MONGO_URI')
    database_name = os.getenv('DATABASE_NAME', 'receipt_scanner')

    # Add TLS if not localhost
    if 'localhost' not in mongo_uri and 'tls=true' not in mongo_uri.lower():
        separator = '&' if '?' in mongo_uri else '?'
        mongo_uri = f"{mongo_uri}{separator}tls=true"

    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=30000)
    db = client[database_name]

    # Test connection
    client.admin.command('ping')
    print("✅ Connected to MongoDB")

    return db

def list_users(db):
    """List all users in the database"""
    learners = list(db.learners.find({}).sort('created_at', -1))

    if not learners:
        print("\n❌ No users found in the database")
        return []

    print("\n📋 Current users in the database:")
    print("-" * 100)

    for i, learner in enumerate(learners, 1):
        email = learner.get('email', 'N/A')
        display_name = learner.get('display_name', 'N/A')
        created_at = learner.get('created_at', 'N/A')
        learner_id = str(learner['_id'])
        total_xp = learner.get('total_xp', 0)

        print(f"{i}. {display_name} ({email})")
        print(f"   ID: {learner_id} | XP: {total_xp} | Created: {created_at}")

    print("-" * 100)
    return learners

def remove_user(db, learner_id):
    """Remove a user and all their associated data"""
    try:
        learner_id_obj = ObjectId(learner_id)

        # Remove from all collections
        collections_to_clean = [
            'learners',
            'learner_skill_states',
            'interactions',
            'learner_achievements',
            'daily_progress',
            'voice_responses',
            'learner_misconceptions',
            'chat_conversations',
            'quest_claims',
            'leaderboard_history',
            'friendships',
            'friend_requests',
            'follows',
            'referrals',
            'payments'
        ]

        deleted_counts = {}

        for collection_name in collections_to_clean:
            collection = db[collection_name]

            # Different deletion strategies based on collection
            if collection_name == 'learners':
                result = collection.delete_one({'_id': learner_id_obj})
            elif collection_name == 'friendships':
                result = collection.delete_many({
                    '$or': [
                        {'user1_id': learner_id_obj},
                        {'user2_id': learner_id_obj}
                    ]
                })
            elif collection_name == 'friend_requests':
                result = collection.delete_many({
                    '$or': [
                        {'from_user_id': learner_id_obj},
                        {'to_user_id': learner_id_obj}
                    ]
                })
            elif collection_name == 'follows':
                result = collection.delete_many({
                    '$or': [
                        {'follower_id': learner_id_obj},
                        {'following_id': learner_id_obj}
                    ]
                })
            elif collection_name == 'referrals':
                result = collection.delete_many({
                    '$or': [
                        {'referrer_id': learner_id},
                        {'referred_id': learner_id}
                    ]
                })
            else:
                result = collection.delete_many({'learner_id': learner_id_obj})

            if result.deleted_count > 0:
                deleted_counts[collection_name] = result.deleted_count

        print(f"\n✅ User removed successfully!")
        print("   Deleted records from:")
        for collection, count in deleted_counts.items():
            print(f"   - {collection}: {count} record(s)")

        return True

    except Exception as e:
        print(f"\n❌ Error removing user: {e}")
        return False

def remove_user_by_email(db, email):
    """Remove a user by email"""
    learner = db.learners.find_one({'email': email})
    if not learner:
        print(f"\n❌ No user found with email: {email}")
        return False

    learner_id = str(learner['_id'])
    display_name = learner.get('display_name', 'N/A')

    print(f"\n🔍 Found user: {display_name} ({email})")
    print(f"   ID: {learner_id}")

    confirm = input(f"\n⚠️  Are you sure you want to remove this user? (yes/no): ").strip().lower()

    if confirm == 'yes':
        return remove_user(db, learner_id)
    else:
        print("❌ Cancelled")
        return False

def main():
    """Main function"""
    print("=" * 100)
    print("🗑️  USER REMOVAL TOOL - Test Onboarding")
    print("=" * 100)

    try:
        db = connect_db()

        if len(sys.argv) > 1:
            # Email provided as argument
            email = sys.argv[1]
            remove_user_by_email(db, email)
        else:
            # Interactive mode
            learners = list_users(db)

            if not learners:
                return

            print("\n🎯 Options:")
            print("1. Enter the number of the user to remove")
            print("2. Enter 'all' to remove all users")
            print("3. Enter 'q' to quit")

            choice = input("\nYour choice: ").strip()

            if choice.lower() == 'q':
                print("👋 Goodbye!")
                return

            if choice.lower() == 'all':
                confirm = input(f"\n⚠️  Are you sure you want to remove ALL {len(learners)} users? (yes/no): ").strip().lower()

                if confirm == 'yes':
                    for learner in learners:
                        learner_id = str(learner['_id'])
                        email = learner.get('email', 'N/A')
                        print(f"\n🗑️  Removing {email}...")
                        remove_user(db, learner_id)
                    print(f"\n✅ All {len(learners)} users removed!")
                else:
                    print("❌ Cancelled")
            else:
                try:
                    idx = int(choice) - 1
                    if 0 <= idx < len(learners):
                        learner = learners[idx]
                        learner_id = str(learner['_id'])
                        email = learner.get('email', 'N/A')
                        display_name = learner.get('display_name', 'N/A')

                        confirm = input(f"\n⚠️  Remove {display_name} ({email})? (yes/no): ").strip().lower()

                        if confirm == 'yes':
                            remove_user(db, learner_id)
                        else:
                            print("❌ Cancelled")
                    else:
                        print("❌ Invalid selection")
                except ValueError:
                    print("❌ Invalid input")

    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == '__main__':
    main()
