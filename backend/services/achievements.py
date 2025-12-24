"""
Achievement Service

Handles:
- Achievement checking and awarding
- Criteria evaluation
- XP rewards
- Gamification logic
"""

from datetime import datetime
from bson import ObjectId


class AchievementService:
    """Service for managing learner achievements and gamification."""

    ACHIEVEMENT_DEFINITIONS = [
        {
            'slug': 'first-lesson',
            'name': 'First Steps',
            'description': 'Complete your first lesson',
            'xp': 50,
            'criteria': {'type': 'lessons_completed', 'threshold': 1}
        },
        {
            'slug': 'week-streak',
            'name': 'Week Warrior',
            'description': 'Maintain a 7-day learning streak',
            'xp': 100,
            'criteria': {'type': 'streak', 'threshold': 7}
        },
        {
            'slug': 'month-streak',
            'name': 'Monthly Master',
            'description': 'Maintain a 30-day learning streak',
            'xp': 500,
            'criteria': {'type': 'streak', 'threshold': 30}
        },
        {
            'slug': 'first-mastery',
            'name': 'Skill Master',
            'description': 'Master your first skill',
            'xp': 100,
            'criteria': {'type': 'skills_mastered', 'threshold': 1}
        },
        {
            'slug': 'five-mastery',
            'name': 'Knowledge Seeker',
            'description': 'Master 5 skills',
            'xp': 250,
            'criteria': {'type': 'skills_mastered', 'threshold': 5}
        },
        {
            'slug': 'ten-mastery',
            'name': 'Financial Expert',
            'description': 'Master 10 skills',
            'xp': 500,
            'criteria': {'type': 'skills_mastered', 'threshold': 10}
        },
        {
            'slug': 'perfect-session',
            'name': 'Perfect!',
            'description': 'Get 10 questions correct in a row',
            'xp': 75,
            'criteria': {'type': 'streak_correct', 'threshold': 10}
        },
        {
            'slug': 'xp-1000',
            'name': 'XP Hunter',
            'description': 'Earn 1,000 total XP',
            'xp': 100,
            'criteria': {'type': 'total_xp', 'threshold': 1000}
        },
        {
            'slug': 'xp-5000',
            'name': 'XP Master',
            'description': 'Earn 5,000 total XP',
            'xp': 250,
            'criteria': {'type': 'total_xp', 'threshold': 5000}
        },
        {
            'slug': 'hundred-questions',
            'name': 'Century Club',
            'description': 'Answer 100 questions',
            'xp': 150,
            'criteria': {'type': 'total_interactions', 'threshold': 100}
        },
        {
            'slug': 'early-bird',
            'name': 'Early Bird',
            'description': 'Complete a lesson before 9 AM',
            'xp': 50,
            'criteria': {'type': 'early_bird', 'threshold': 1}
        },
        {
            'slug': 'night-owl',
            'name': 'Night Owl',
            'description': 'Complete a lesson after 10 PM',
            'xp': 50,
            'criteria': {'type': 'night_owl', 'threshold': 1}
        }
    ]

    def __init__(self, collections):
        """
        Initialize achievement service.

        Args:
            collections: FinLitCollections instance
        """
        self.collections = collections

    def check_achievements(self, learner_id):
        """
        Check and award any newly earned achievements.

        Args:
            learner_id: Learner ID (string)

        Returns:
            list: Newly earned achievements with details
        """
        try:
            # Get learner
            learner = self.collections.learners.find_one({'_id': ObjectId(learner_id)})
            if not learner:
                return []

            newly_earned = []

            for defn in self.ACHIEVEMENT_DEFINITIONS:
                # Check if already earned
                achievement = self.collections.achievements.find_one({'slug': defn['slug']})
                if not achievement:
                    # Achievement doesn't exist in DB yet, skip
                    continue

                existing = self.collections.learner_achievements.find_one({
                    'learner_id': ObjectId(learner_id),
                    'achievement_id': achievement['_id']
                })

                if existing:
                    # Already earned
                    continue

                # Check criteria
                earned = self._check_criteria(learner_id, defn['criteria'])

                if earned:
                    # Award achievement
                    self.collections.learner_achievements.insert_one({
                        'learner_id': ObjectId(learner_id),
                        'achievement_id': achievement['_id'],
                        'earned_at': datetime.utcnow(),
                        'created_at': datetime.utcnow()
                    })

                    # Award XP
                    xp_reward = defn['xp']
                    self.collections.learners.update_one(
                        {'_id': ObjectId(learner_id)},
                        {
                            '$inc': {'total_xp': xp_reward},
                            '$set': {'updated_at': datetime.utcnow()}
                        }
                    )

                    newly_earned.append({
                        'achievement_id': str(achievement['_id']),
                        'slug': defn['slug'],
                        'name': defn['name'],
                        'description': defn['description'],
                        'icon_url': achievement.get('icon_url'),
                        'xp_reward': xp_reward
                    })

            return newly_earned

        except Exception as e:
            print(f"Error checking achievements: {e}")
            return []

    def _check_criteria(self, learner_id, criteria):
        """
        Check if learner meets achievement criteria.

        Args:
            learner_id: Learner ID (string)
            criteria: Achievement criteria dict

        Returns:
            bool: True if criteria met
        """
        try:
            ctype = criteria['type']
            threshold = criteria['threshold']

            if ctype == 'streak':
                # Check current streak
                learner = self.collections.learners.find_one({'_id': ObjectId(learner_id)})
                if not learner:
                    return False
                return (learner.get('streak_count', 0) or 0) >= threshold

            elif ctype == 'skills_mastered':
                # Count mastered skills
                count = self.collections.learner_skill_states.count_documents({
                    'learner_id': ObjectId(learner_id),
                    'status': 'mastered'
                })
                return count >= threshold

            elif ctype == 'total_xp':
                # Check total XP
                learner = self.collections.learners.find_one({'_id': ObjectId(learner_id)})
                if not learner:
                    return False
                return (learner.get('total_xp', 0) or 0) >= threshold

            elif ctype == 'lessons_completed':
                # Sum lessons completed from daily progress
                pipeline = [
                    {'$match': {'learner_id': ObjectId(learner_id)}},
                    {'$group': {
                        '_id': None,
                        'total': {'$sum': '$lessons_completed'}
                    }}
                ]
                result = list(self.collections.daily_progress.aggregate(pipeline))
                total = result[0]['total'] if result else 0
                return total >= threshold

            elif ctype == 'total_interactions':
                # Count total interactions
                count = self.collections.interactions.count_documents({
                    'learner_id': ObjectId(learner_id)
                })
                return count >= threshold

            elif ctype == 'streak_correct':
                # Check for consecutive correct answers
                # Get recent interactions
                recent = list(self.collections.interactions.find({
                    'learner_id': ObjectId(learner_id)
                }).sort('created_at', -1).limit(threshold))

                if len(recent) < threshold:
                    return False

                # Check if all are correct
                return all(interaction.get('is_correct', False) for interaction in recent)

            elif ctype == 'early_bird':
                # Check if completed lesson before 9 AM
                interaction = self.collections.interactions.find_one({
                    'learner_id': ObjectId(learner_id)
                })
                if interaction and interaction.get('created_at'):
                    hour = interaction['created_at'].hour
                    return hour < 9
                return False

            elif ctype == 'night_owl':
                # Check if completed lesson after 10 PM
                interaction = self.collections.interactions.find_one({
                    'learner_id': ObjectId(learner_id)
                })
                if interaction and interaction.get('created_at'):
                    hour = interaction['created_at'].hour
                    return hour >= 22
                return False

            return False

        except Exception as e:
            print(f"Error checking criteria {criteria}: {e}")
            return False

    def get_learner_achievements(self, learner_id):
        """
        Get all achievements earned by a learner.

        Args:
            learner_id: Learner ID (string)

        Returns:
            list: Earned achievements with details
        """
        try:
            # Get learner achievements
            learner_achievements = list(self.collections.learner_achievements.find({
                'learner_id': ObjectId(learner_id)
            }))

            results = []
            for la in learner_achievements:
                achievement = self.collections.achievements.find_one({
                    '_id': la['achievement_id']
                })

                if achievement:
                    results.append({
                        'achievement_id': str(achievement['_id']),
                        'slug': achievement.get('slug'),
                        'name': achievement.get('name'),
                        'description': achievement.get('description'),
                        'icon_url': achievement.get('icon_url'),
                        'xp_reward': achievement.get('xp_reward', 0),
                        'earned_at': la.get('earned_at').isoformat() if la.get('earned_at') else None
                    })

            return results

        except Exception as e:
            print(f"Error getting learner achievements: {e}")
            return []

    def get_available_achievements(self, learner_id):
        """
        Get all achievements not yet earned by a learner.

        Args:
            learner_id: Learner ID (string)

        Returns:
            list: Available achievements with progress
        """
        try:
            # Get earned achievement IDs
            earned_ids = set()
            learner_achievements = self.collections.learner_achievements.find({
                'learner_id': ObjectId(learner_id)
            })
            for la in learner_achievements:
                earned_ids.add(la['achievement_id'])

            # Get all achievements
            all_achievements = list(self.collections.achievements.find({}))

            results = []
            for achievement in all_achievements:
                if achievement['_id'] in earned_ids:
                    continue

                # Get criteria definition
                defn = next(
                    (d for d in self.ACHIEVEMENT_DEFINITIONS if d['slug'] == achievement.get('slug')),
                    None
                )

                if defn:
                    # Calculate progress
                    progress = self._calculate_progress(learner_id, defn['criteria'])

                    results.append({
                        'achievement_id': str(achievement['_id']),
                        'slug': achievement.get('slug'),
                        'name': achievement.get('name'),
                        'description': achievement.get('description'),
                        'icon_url': achievement.get('icon_url'),
                        'xp_reward': achievement.get('xp_reward', 0),
                        'progress': progress,
                        'threshold': defn['criteria']['threshold']
                    })

            return results

        except Exception as e:
            print(f"Error getting available achievements: {e}")
            return []

    def _calculate_progress(self, learner_id, criteria):
        """
        Calculate progress toward achievement criteria.

        Args:
            learner_id: Learner ID (string)
            criteria: Achievement criteria dict

        Returns:
            int: Current progress value
        """
        try:
            ctype = criteria['type']

            if ctype == 'streak':
                learner = self.collections.learners.find_one({'_id': ObjectId(learner_id)})
                return learner.get('streak_count', 0) if learner else 0

            elif ctype == 'skills_mastered':
                return self.collections.learner_skill_states.count_documents({
                    'learner_id': ObjectId(learner_id),
                    'status': 'mastered'
                })

            elif ctype == 'total_xp':
                learner = self.collections.learners.find_one({'_id': ObjectId(learner_id)})
                return learner.get('total_xp', 0) if learner else 0

            elif ctype == 'lessons_completed':
                pipeline = [
                    {'$match': {'learner_id': ObjectId(learner_id)}},
                    {'$group': {
                        '_id': None,
                        'total': {'$sum': '$lessons_completed'}
                    }}
                ]
                result = list(self.collections.daily_progress.aggregate(pipeline))
                return result[0]['total'] if result else 0

            elif ctype == 'total_interactions':
                return self.collections.interactions.count_documents({
                    'learner_id': ObjectId(learner_id)
                })

            elif ctype == 'streak_correct':
                # Count current correct streak
                interactions = list(self.collections.interactions.find({
                    'learner_id': ObjectId(learner_id)
                }).sort('created_at', -1).limit(criteria['threshold']))

                streak = 0
                for interaction in interactions:
                    if interaction.get('is_correct', False):
                        streak += 1
                    else:
                        break
                return streak

            return 0

        except Exception as e:
            print(f"Error calculating progress: {e}")
            return 0
