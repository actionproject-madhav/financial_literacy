"""
Seed Achievements

Seeds the achievements collection with predefined achievements.
Run this script to populate the database with gamification achievements.
"""

import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import Database


ACHIEVEMENTS = [
    {
        'slug': 'first-lesson',
        'name': 'First Steps',
        'description': 'Complete your first lesson',
        'icon_url': '🎯',
        'xp_reward': 50,
        'criteria': {
            'type': 'lessons_completed',
            'threshold': 1
        },
        'rarity': 'common'
    },
    {
        'slug': 'week-streak',
        'name': 'Week Warrior',
        'description': 'Maintain a 7-day learning streak',
        'icon_url': '🔥',
        'xp_reward': 100,
        'criteria': {
            'type': 'streak',
            'threshold': 7
        },
        'rarity': 'uncommon'
    },
    {
        'slug': 'month-streak',
        'name': 'Monthly Master',
        'description': 'Maintain a 30-day learning streak',
        'icon_url': '⚡',
        'xp_reward': 500,
        'criteria': {
            'type': 'streak',
            'threshold': 30
        },
        'rarity': 'epic'
    },
    {
        'slug': 'first-mastery',
        'name': 'Skill Master',
        'description': 'Master your first skill',
        'icon_url': '🏆',
        'xp_reward': 100,
        'criteria': {
            'type': 'skills_mastered',
            'threshold': 1
        },
        'rarity': 'uncommon'
    },
    {
        'slug': 'five-mastery',
        'name': 'Knowledge Seeker',
        'description': 'Master 5 skills',
        'icon_url': '📚',
        'xp_reward': 250,
        'criteria': {
            'type': 'skills_mastered',
            'threshold': 5
        },
        'rarity': 'rare'
    },
    {
        'slug': 'ten-mastery',
        'name': 'Financial Expert',
        'description': 'Master 10 skills',
        'icon_url': '💎',
        'xp_reward': 500,
        'criteria': {
            'type': 'skills_mastered',
            'threshold': 10
        },
        'rarity': 'epic'
    },
    {
        'slug': 'perfect-session',
        'name': 'Perfect!',
        'description': 'Get 10 questions correct in a row',
        'icon_url': '⭐',
        'xp_reward': 75,
        'criteria': {
            'type': 'streak_correct',
            'threshold': 10
        },
        'rarity': 'uncommon'
    },
    {
        'slug': 'xp-1000',
        'name': 'XP Hunter',
        'description': 'Earn 1,000 total XP',
        'icon_url': '🎖️',
        'xp_reward': 100,
        'criteria': {
            'type': 'total_xp',
            'threshold': 1000
        },
        'rarity': 'uncommon'
    },
    {
        'slug': 'xp-5000',
        'name': 'XP Master',
        'description': 'Earn 5,000 total XP',
        'icon_url': '🏅',
        'xp_reward': 250,
        'criteria': {
            'type': 'total_xp',
            'threshold': 5000
        },
        'rarity': 'rare'
    },
    {
        'slug': 'hundred-questions',
        'name': 'Century Club',
        'description': 'Answer 100 questions',
        'icon_url': '💯',
        'xp_reward': 150,
        'criteria': {
            'type': 'total_interactions',
            'threshold': 100
        },
        'rarity': 'rare'
    },
    {
        'slug': 'early-bird',
        'name': 'Early Bird',
        'description': 'Complete a lesson before 9 AM',
        'icon_url': '🌅',
        'xp_reward': 50,
        'criteria': {
            'type': 'early_bird',
            'threshold': 1
        },
        'rarity': 'common'
    },
    {
        'slug': 'night-owl',
        'name': 'Night Owl',
        'description': 'Complete a lesson after 10 PM',
        'icon_url': '🦉',
        'xp_reward': 50,
        'criteria': {
            'type': 'night_owl',
            'threshold': 1
        },
        'rarity': 'common'
    },
    {
        'slug': 'speed-demon',
        'name': 'Speed Demon',
        'description': 'Answer a question in under 5 seconds',
        'icon_url': '⚡',
        'xp_reward': 25,
        'criteria': {
            'type': 'fast_answer',
            'threshold': 5000  # milliseconds
        },
        'rarity': 'common'
    },
    {
        'slug': 'perfectionist',
        'name': 'Perfectionist',
        'description': 'Complete a session with 100% accuracy',
        'icon_url': '✨',
        'xp_reward': 100,
        'criteria': {
            'type': 'perfect_session',
            'threshold': 1
        },
        'rarity': 'uncommon'
    },
    {
        'slug': 'credit-expert',
        'name': 'Credit Expert',
        'description': 'Master all credit-related skills',
        'icon_url': '💳',
        'xp_reward': 300,
        'criteria': {
            'type': 'domain_mastery',
            'domain': 'credit',
            'threshold': 1
        },
        'rarity': 'rare'
    },
    {
        'slug': 'banking-pro',
        'name': 'Banking Pro',
        'description': 'Master all banking skills',
        'icon_url': '🏦',
        'xp_reward': 300,
        'criteria': {
            'type': 'domain_mastery',
            'domain': 'banking',
            'threshold': 1
        },
        'rarity': 'rare'
    }
]


def seed_achievements():
    """Seed achievements into the database."""
    print("=" * 60)
    print("SEEDING ACHIEVEMENTS")
    print("=" * 60)

    db = Database()

    if not db.is_connected:
        print("❌ Database not connected")
        return

    print(f"\n📊 Seeding {len(ACHIEVEMENTS)} achievements...")

    created_count = 0
    updated_count = 0
    skipped_count = 0

    for achievement in ACHIEVEMENTS:
        slug = achievement['slug']

        # Check if exists
        existing = db.collections.achievements.find_one({'slug': slug})

        if existing:
            # Update existing
            try:
                db.collections.achievements.update_one(
                    {'slug': slug},
                    {
                        '$set': {
                            'name': achievement['name'],
                            'description': achievement['description'],
                            'icon_url': achievement['icon_url'],
                            'xp_reward': achievement['xp_reward'],
                            'criteria': achievement['criteria'],
                            'rarity': achievement.get('rarity', 'common'),
                            'updated_at': datetime.utcnow()
                        }
                    }
                )
                print(f"  ✓ Updated: {achievement['name']}")
                updated_count += 1
            except Exception as e:
                print(f"  ⚠️  Error updating {slug}: {e}")
                skipped_count += 1
        else:
            # Create new
            try:
                achievement_doc = {
                    'slug': slug,
                    'name': achievement['name'],
                    'description': achievement['description'],
                    'icon_url': achievement['icon_url'],
                    'xp_reward': achievement['xp_reward'],
                    'criteria': achievement['criteria'],
                    'rarity': achievement.get('rarity', 'common'),
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }

                db.collections.achievements.insert_one(achievement_doc)
                print(f"  ✓ Created: {achievement['name']}")
                created_count += 1
            except Exception as e:
                print(f"  ⚠️  Error creating {slug}: {e}")
                skipped_count += 1

    print(f"\n{'=' * 60}")
    print(f"✅ Created: {created_count}")
    print(f"🔄 Updated: {updated_count}")
    print(f"⚠️  Skipped: {skipped_count}")
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    seed_achievements()
