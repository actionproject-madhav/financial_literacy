"""
MongoDB Collections for FinLit Learning Platform

This module defines all MongoDB collections and their helper methods.
Uses the existing MongoDB connection from database.py
"""
from datetime import datetime, date
from typing import Dict, Any, List, Optional
import uuid
from pymongo import ASCENDING, DESCENDING, IndexModel
from bson import ObjectId


class FinLitCollections:
    """
    MongoDB collections manager for FinLit learning platform

    Collections:
    - learners: User profiles and gamification data
    - knowledge_components: Skills and concepts
    - learning_items: Questions, videos, interactive content
    - item_kc_mappings: Item-skill relationships
    - learner_skill_states: Per-user mastery tracking
    - interactions: Student responses and analytics
    - achievements: Available achievements
    - learner_achievements: User achievement progress
    - daily_progress: Daily goal tracking
    - question_templates: Dynamic question generation
    - cultural_contexts: Cultural personalization
    - kc_prerequisites: Skill dependencies
    - curriculum_modules: Curriculum modules/units
    - curriculum_lessons: Individual lessons within modules
    - media_assets: Images, videos, animations, calculators
    """

    def __init__(self, db):
        """Initialize collections with MongoDB database instance"""
        self.db = db

        # Collection references
        self.learners = db.learners
        self.knowledge_components = db.knowledge_components
        self.learning_items = db.learning_items
        self.item_kc_mappings = db.item_kc_mappings
        self.learner_skill_states = db.learner_skill_states
        self.interactions = db.interactions
        self.achievements = db.achievements
        self.learner_achievements = db.learner_achievements
        self.daily_progress = db.daily_progress
        self.question_templates = db.question_templates
        self.cultural_contexts = db.cultural_contexts
        self.kc_prerequisites = db.kc_prerequisites

        # Voice and misconception collections
        self.voice_responses = db.voice_responses
        self.misconceptions = db.misconceptions
        self.learner_misconceptions = db.learner_misconceptions

        # Curriculum collections
        self.curriculum_modules = db.curriculum_modules
        self.curriculum_lessons = db.curriculum_lessons

        # Media assets collection
        self.media_assets = db.media_assets

        # Chat conversations collection
        self.chat_conversations = db.chat_conversations

        # Quests and leaderboard collections
        self.quest_claims = db.quest_claims
        self.leaderboard_history = db.leaderboard_history

        # Social features collections
        self.friendships = db.friendships  # Bidirectional friend connections
        self.friend_requests = db.friend_requests  # Pending friend requests
        self.follows = db.follows  # Unidirectional follows
        self.referrals = db.referrals  # Referral tracking
        
        # Payment collections
        self.payments = db.payments  # Payment transactions
    
    def _to_object_id(self, id_value):
        """Convert string ID to ObjectId, or return as-is if already ObjectId"""
        if isinstance(id_value, ObjectId):
            return id_value
        if isinstance(id_value, str):
            try:
                return ObjectId(id_value)
            except:
                return id_value
        return id_value

    def create_indexes(self):
        """Create all indexes for optimal query performance"""
        print("Creating MongoDB indexes for FinLit collections...")

        # Learners indexes
        self.learners.create_index([("email", ASCENDING)], unique=True)
        self.learners.create_index([("created_at", DESCENDING)])
        # Text index for search optimization (display_name and email)
        try:
            self.learners.create_index([("display_name", "text"), ("email", "text")])
        except Exception as e:
            # Text index might already exist or require different syntax
            print(f"  Note: Text index creation: {e}")
        # Regular index on display_name for regex searches
        self.learners.create_index([("display_name", ASCENDING)])

        # Knowledge Components indexes
        self.knowledge_components.create_index([("slug", ASCENDING)], unique=True)
        self.knowledge_components.create_index([("domain", ASCENDING)])
        self.knowledge_components.create_index([("parent_kc_id", ASCENDING)])
        self.knowledge_components.create_index([("is_active", ASCENDING)])

        # Learning Items indexes
        self.learning_items.create_index([("item_type", ASCENDING)])
        self.learning_items.create_index([("is_active", ASCENDING)])
        self.learning_items.create_index([("difficulty", ASCENDING)])

        # Item-KC Mappings indexes
        self.item_kc_mappings.create_index([
            ("item_id", ASCENDING),
            ("kc_id", ASCENDING)
        ], unique=True)
        self.item_kc_mappings.create_index([("kc_id", ASCENDING)])

        # Learner Skill States indexes
        self.learner_skill_states.create_index([
            ("learner_id", ASCENDING),
            ("kc_id", ASCENDING)
        ], unique=True)
        self.learner_skill_states.create_index([("learner_id", ASCENDING)])
        self.learner_skill_states.create_index([("status", ASCENDING)])
        self.learner_skill_states.create_index([("next_review_at", ASCENDING)])

        # Interactions indexes
        self.interactions.create_index([
            ("learner_id", ASCENDING),
            ("created_at", DESCENDING)
        ])
        self.interactions.create_index([("item_id", ASCENDING)])
        self.interactions.create_index([("kc_id", ASCENDING)])
        self.interactions.create_index([("session_id", ASCENDING)])

        # Achievements indexes
        self.achievements.create_index([("slug", ASCENDING)], unique=True)

        # Learner Achievements indexes
        self.learner_achievements.create_index([
            ("learner_id", ASCENDING),
            ("achievement_id", ASCENDING)
        ], unique=True)
        self.learner_achievements.create_index([("learner_id", ASCENDING)])

        # Daily Progress indexes
        self.daily_progress.create_index([
            ("learner_id", ASCENDING),
            ("date", DESCENDING)
        ], unique=True)
        self.daily_progress.create_index([("learner_id", ASCENDING)])
        self.daily_progress.create_index([("date", ASCENDING)])  # For weekly queries
        self.daily_progress.create_index([("learner_id", ASCENDING), ("date", ASCENDING)])  # Compound for leaderboard

        # Question Templates indexes
        self.question_templates.create_index([("kc_id", ASCENDING)])

        # Cultural Contexts indexes
        self.cultural_contexts.create_index([("kc_id", ASCENDING)])
        self.cultural_contexts.create_index([("country_code", ASCENDING)])

        # KC Prerequisites indexes
        self.kc_prerequisites.create_index([
            ("kc_id", ASCENDING),
            ("prerequisite_kc_id", ASCENDING)
        ], unique=True)

        # Voice Responses indexes
        self.voice_responses.create_index([("learner_id", ASCENDING)])
        self.voice_responses.create_index([("interaction_id", ASCENDING)])
        self.voice_responses.create_index([("kc_id", ASCENDING)])
        self.voice_responses.create_index([("created_at", DESCENDING)])

        # Misconceptions indexes
        self.misconceptions.create_index([("kc_id", ASCENDING)])
        self.misconceptions.create_index([("pattern_type", ASCENDING)])
        self.misconceptions.create_index([("countries_affected", ASCENDING)])

        # Learner Misconceptions indexes
        self.learner_misconceptions.create_index([
            ("learner_id", ASCENDING),
            ("misconception_id", ASCENDING)
        ], unique=True)
        self.learner_misconceptions.create_index([("learner_id", ASCENDING)])
        self.learner_misconceptions.create_index([("resolved", ASCENDING)])

        # Curriculum Modules indexes
        self.curriculum_modules.create_index([("module_id", ASCENDING)], unique=True)
        self.curriculum_modules.create_index([("order", ASCENDING)])

        # Curriculum Lessons indexes
        self.curriculum_lessons.create_index([("lesson_id", ASCENDING)], unique=True)
        self.curriculum_lessons.create_index([("module_id", ASCENDING)])
        self.curriculum_lessons.create_index([("skill_slug", ASCENDING)])
        self.curriculum_lessons.create_index([
            ("module_id", ASCENDING),
            ("order", ASCENDING)
        ])

        # Media Assets indexes
        self.media_assets.create_index([("asset_id", ASCENDING)], unique=True)
        self.media_assets.create_index([("type", ASCENDING)])
        self.media_assets.create_index([("tags", ASCENDING)])
        self.media_assets.create_index([("used_in", ASCENDING)])

        # Chat Conversations indexes
        self.chat_conversations.create_index([("learner_id", ASCENDING)])
        self.chat_conversations.create_index([("updated_at", DESCENDING)])

        # Quest Claims indexes
        self.quest_claims.create_index([("learner_id", ASCENDING)])
        self.quest_claims.create_index([("quest_id", ASCENDING)])
        self.quest_claims.create_index([("claimed_at", DESCENDING)])
        self.quest_claims.create_index([
            ("learner_id", ASCENDING),
            ("quest_id", ASCENDING),
            ("claimed_at", DESCENDING)
        ])

        # Leaderboard History indexes
        self.leaderboard_history.create_index([("week_start", DESCENDING)])
        self.leaderboard_history.create_index([("learner_id", ASCENDING)])
        self.leaderboard_history.create_index([
            ("week_start", DESCENDING),
            ("xp_earned", DESCENDING)
        ])

        # Friendships indexes
        self.friendships.create_index([
            ("user1_id", ASCENDING),
            ("user2_id", ASCENDING)
        ], unique=True)
        self.friendships.create_index([("user1_id", ASCENDING)])
        self.friendships.create_index([("user2_id", ASCENDING)])
        self.friendships.create_index([("created_at", DESCENDING)])

        # Friend Requests indexes
        self.friend_requests.create_index([
            ("from_user_id", ASCENDING),
            ("to_user_id", ASCENDING)
        ], unique=True)
        self.friend_requests.create_index([("to_user_id", ASCENDING)])
        self.friend_requests.create_index([("status", ASCENDING)])
        self.friend_requests.create_index([("created_at", DESCENDING)])

        # Follows indexes
        self.follows.create_index([
            ("follower_id", ASCENDING),
            ("following_id", ASCENDING)
        ], unique=True)
        self.follows.create_index([("follower_id", ASCENDING)])
        self.follows.create_index([("following_id", ASCENDING)])
        self.follows.create_index([("created_at", DESCENDING)])

        # Referrals indexes
        self.referrals.create_index([("referrer_id", ASCENDING)])
        self.referrals.create_index([("referred_id", ASCENDING)], unique=True)
        self.referrals.create_index([("referral_code", ASCENDING)], unique=True)
        self.referrals.create_index([("created_at", DESCENDING)])

        # Payments indexes
        self.payments.create_index([("learner_id", ASCENDING)])
        self.payments.create_index([("payment_intent_id", ASCENDING)], unique=True)
        self.payments.create_index([("status", ASCENDING)])
        self.payments.create_index([("created_at", DESCENDING)])

        print("All indexes created successfully!")

    # ========== LEARNER METHODS ==========

    def create_learner(self, email: str, display_name: str = None, **kwargs) -> str:
        """Create a new learner"""
        learner = {
            'email': email,
            'display_name': display_name,
            'native_language': kwargs.get('native_language'),
            'english_proficiency': kwargs.get('english_proficiency', 'intermediate'),
            'immigration_status': kwargs.get('immigration_status'),
            'financial_experience_level': kwargs.get('financial_experience_level', 'novice'),
            'daily_goal_minutes': kwargs.get('daily_goal_minutes', 10),
            'timezone': kwargs.get('timezone', 'America/New_York'),
            'streak_count': 0,
            'streak_last_date': None,
            'total_xp': 0,
            'gems': kwargs.get('gems', 0),  # Start with 0 gems
            'hearts': kwargs.get('hearts', 5),  # Start with 5 hearts
            'last_heart_lost_at': None,  # Track when last heart was lost for recharge
            'country_of_origin': kwargs.get('country_of_origin'),
            'visa_type': kwargs.get('visa_type'),
            'has_ssn': kwargs.get('has_ssn'),
            'sends_remittances': kwargs.get('sends_remittances'),
            'financial_goals': kwargs.get('financial_goals', []),
            'profile_picture_url': kwargs.get('profile_picture_url', ''),  # Google profile picture
            'avatar_url': kwargs.get('avatar_url', ''),  # Built-in character avatar or uploaded
            'created_at': datetime.utcnow(),
            'last_active_at': None
        }
        result = self.learners.insert_one(learner)
        return str(result.inserted_id)

    def get_learner_by_email(self, email: str) -> Optional[Dict]:
        """Get learner by email"""
        return self.learners.find_one({'email': email})

    def get_learner_by_id(self, learner_id: str) -> Optional[Dict]:
        """Get learner by ID"""
        return self.learners.find_one({'_id': ObjectId(learner_id)})

    def update_learner(self, learner_id: str, updates: Dict) -> bool:
        """Update learner information"""
        updates['last_active_at'] = datetime.utcnow()
        result = self.learners.update_one(
            {'_id': ObjectId(learner_id)},
            {'$set': updates}
        )
        return result.modified_count > 0

    def update_streak(self, learner_id: str, increment: bool = True) -> bool:
        """Update learner's streak"""
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        if increment:
            result = self.learners.update_one(
                {'_id': ObjectId(learner_id)},
                {
                    '$inc': {'streak_count': 1},
                    '$set': {'streak_last_date': today}
                }
            )
        else:
            result = self.learners.update_one(
                {'_id': ObjectId(learner_id)},
                {'$set': {'streak_count': 0, 'streak_last_date': None}}
            )
        return result.modified_count > 0

    def add_xp(self, learner_id: str, xp_amount: int) -> bool:
        """Add XP to learner and update daily progress for leaderboard tracking"""
        result = self.learners.update_one(
            {'_id': ObjectId(learner_id)},
            {'$inc': {'total_xp': xp_amount}}
        )

        # Update daily progress for leaderboard tracking
        today = date.today()
        self.update_daily_progress(
            learner_id=learner_id,
            date_obj=today,
            xp_earned=xp_amount
        )

        return result.modified_count > 0

    # ========== KNOWLEDGE COMPONENT METHODS ==========

    def create_knowledge_component(self, slug: str, name: str, domain: str, **kwargs) -> str:
        """Create a knowledge component"""
        kc = {
            'slug': slug,
            'name': name,
            'description': kwargs.get('description'),
            'domain': domain,
            'parent_kc_id': kwargs.get('parent_kc_id'),
            'difficulty_tier': kwargs.get('difficulty_tier', 1),
            'bloom_level': kwargs.get('bloom_level'),
            'estimated_minutes': kwargs.get('estimated_minutes', 15),
            'icon_url': kwargs.get('icon_url'),
            'is_active': kwargs.get('is_active', True),
            'created_at': datetime.utcnow()
        }
        result = self.knowledge_components.insert_one(kc)
        return str(result.inserted_id)

    def get_knowledge_component(self, kc_id: str) -> Optional[Dict]:
        """Get knowledge component by ID"""
        return self.knowledge_components.find_one({'_id': ObjectId(kc_id)})

    def get_knowledge_component_by_slug(self, slug: str) -> Optional[Dict]:
        """Get knowledge component by slug"""
        return self.knowledge_components.find_one({'slug': slug})

    def get_knowledge_components_by_domain(self, domain: str) -> List[Dict]:
        """Get all KCs in a domain"""
        return list(self.knowledge_components.find({'domain': domain, 'is_active': True}))

    def get_child_components(self, parent_kc_id: str) -> List[Dict]:
        """Get child knowledge components"""
        return list(self.knowledge_components.find({'parent_kc_id': ObjectId(parent_kc_id)}))

    # ========== LEARNING ITEM METHODS ==========

    def create_learning_item(self, item_type: str, content: Dict, **kwargs) -> str:
        """Create a learning item"""
        item = {
            'item_type': item_type,
            'content': content,
            'difficulty': kwargs.get('difficulty', 0.5),
            'discrimination': kwargs.get('discrimination', 1.0),
            'response_count': 0,
            'correct_rate': None,
            'avg_response_time_ms': None,
            'media_type': kwargs.get('media_type'),
            'media_url': kwargs.get('media_url'),
            'allows_llm_personalization': kwargs.get('allows_llm_personalization', True),
            'forgetting_curve_factor': kwargs.get('forgetting_curve_factor', 1.0),
            'is_active': kwargs.get('is_active', True),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = self.learning_items.insert_one(item)
        return str(result.inserted_id)

    def get_learning_item(self, item_id: str) -> Optional[Dict]:
        """Get learning item by ID"""
        return self.learning_items.find_one({'_id': ObjectId(item_id)})

    def update_item_statistics(self, item_id: str, is_correct: bool, response_time_ms: int) -> bool:
        """Update item statistics after a response"""
        item = self.get_learning_item(item_id)
        if not item:
            return False

        # Handle None values - initialize if not present
        response_count = item.get('response_count', 0) or 0
        new_count = response_count + 1
        old_correct_rate = item.get('correct_rate', 0.5) or 0.5
        old_correct = old_correct_rate * response_count
        new_correct_rate = (old_correct + (1 if is_correct else 0)) / new_count

        # Update average response time
        old_avg = item.get('avg_response_time_ms') or response_time_ms
        new_avg = ((old_avg * response_count) + response_time_ms) / new_count

        result = self.learning_items.update_one(
            {'_id': ObjectId(item_id)},
            {
                '$set': {
                    'response_count': new_count,
                    'correct_rate': new_correct_rate,
                    'avg_response_time_ms': int(new_avg),
                    'updated_at': datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0

    # ========== ITEM-KC MAPPING METHODS ==========

    def create_item_kc_mapping(self, item_id: str, kc_id: str, weight: float = 1.0) -> str:
        """Map an item to a knowledge component"""
        mapping = {
            'item_id': ObjectId(item_id),
            'kc_id': ObjectId(kc_id),
            'weight': weight
        }
        result = self.item_kc_mappings.insert_one(mapping)
        return str(result.inserted_id)

    def get_items_for_kc(self, kc_id: str) -> List[Dict]:
        """Get all items mapped to a knowledge component"""
        mappings = list(self.item_kc_mappings.find({'kc_id': ObjectId(kc_id)}))
        item_ids = [m['item_id'] for m in mappings]
        return list(self.learning_items.find({'_id': {'$in': item_ids}, 'is_active': True}))

    def get_kcs_for_item(self, item_id: str) -> List[Dict]:
        """Get all KCs an item is mapped to"""
        mappings = list(self.item_kc_mappings.find({'item_id': ObjectId(item_id)}))
        kc_ids = [m['kc_id'] for m in mappings]
        return list(self.knowledge_components.find({'_id': {'$in': kc_ids}}))

    # ========== LEARNER SKILL STATE METHODS ==========

    def create_learner_skill_state(self, learner_id: str, kc_id: str, **kwargs) -> str:
        """Create or initialize learner's skill state for a KC"""
        state = {
            'learner_id': ObjectId(learner_id),
            'kc_id': ObjectId(kc_id),
            'p_mastery': kwargs.get('p_mastery', 0.1),
            'stability_days': kwargs.get('stability_days', 1.0),
            'difficulty': kwargs.get('difficulty', 0.3),
            'retrievability': kwargs.get('retrievability', 1.0),
            'total_attempts': 0,
            'correct_count': 0,
            'current_streak': 0,
            'best_streak': 0,
            'last_practiced_at': None,
            'next_review_at': None,
            'interval_days': 1,
            'status': kwargs.get('status', 'locked'),  # locked, available, in_progress, mastered
            'unlocked_at': None,
            'mastered_at': None,
            'updated_at': datetime.utcnow()
        }
        result = self.learner_skill_states.insert_one(state)
        return str(result.inserted_id)

    def get_learner_skill_state(self, learner_id: str, kc_id: str) -> Optional[Dict]:
        """Get learner's skill state for a KC"""
        return self.learner_skill_states.find_one({
            'learner_id': ObjectId(learner_id),
            'kc_id': ObjectId(kc_id)
        })

    def update_skill_state(self, learner_id: str, kc_id: str, updates: Dict) -> bool:
        """Update learner's skill state"""
        updates['updated_at'] = datetime.utcnow()
        result = self.learner_skill_states.update_one(
            {
                'learner_id': ObjectId(learner_id),
                'kc_id': ObjectId(kc_id)
            },
            {'$set': updates}
        )
        return result.modified_count > 0

    def get_learner_skills(self, learner_id: str, status: str = None) -> List[Dict]:
        """Get all skill states for a learner"""
        query = {'learner_id': ObjectId(learner_id)}
        if status:
            query['status'] = status
        return list(self.learner_skill_states.find(query))

    def get_skills_for_review(self, learner_id: str) -> List[Dict]:
        """Get skills due for review"""
        return list(self.learner_skill_states.find({
            'learner_id': ObjectId(learner_id),
            'next_review_at': {'$lte': datetime.utcnow()},
            'status': {'$in': ['in_progress', 'mastered']}
        }).sort('next_review_at', ASCENDING))

    # ========== INTERACTION METHODS ==========

    def create_interaction(self, learner_id: str, item_id: str, kc_id: str,
                          session_id: str, is_correct: bool, **kwargs) -> str:
        """Record a learner interaction"""
        interaction = {
            'learner_id': ObjectId(learner_id),
            'item_id': ObjectId(item_id),
            'kc_id': ObjectId(kc_id),
            'session_id': session_id,
            'is_correct': is_correct,
            'response_value': kwargs.get('response_value'),
            'response_time_ms': kwargs.get('response_time_ms'),
            'hint_used': kwargs.get('hint_used', False),
            'p_mastery_before': kwargs.get('p_mastery_before'),
            'retrievability_before': kwargs.get('retrievability_before'),
            'days_since_last_review': kwargs.get('days_since_last_review'),
            'selection_method': kwargs.get('selection_method'),
            'predicted_p_correct': kwargs.get('predicted_p_correct'),
            'created_at': datetime.utcnow()
        }
        result = self.interactions.insert_one(interaction)
        return str(result.inserted_id)

    def get_learner_interactions(self, learner_id: str, limit: int = 100) -> List[Dict]:
        """Get recent interactions for a learner"""
        return list(self.interactions.find({
            'learner_id': ObjectId(learner_id)
        }).sort('created_at', DESCENDING).limit(limit))

    def get_session_interactions(self, session_id: str) -> List[Dict]:
        """Get all interactions in a session"""
        return list(self.interactions.find({
            'session_id': session_id
        }).sort('created_at', ASCENDING))

    # ========== ACHIEVEMENT METHODS ==========

    def create_achievement(self, slug: str, name: str, **kwargs) -> str:
        """Create an achievement"""
        achievement = {
            'slug': slug,
            'name': name,
            'description': kwargs.get('description'),
            'icon_url': kwargs.get('icon_url'),
            'xp_reward': kwargs.get('xp_reward', 0),
            'criteria': kwargs.get('criteria', {})
        }
        result = self.achievements.insert_one(achievement)
        return str(result.inserted_id)

    def get_achievement(self, achievement_id: str) -> Optional[Dict]:
        """Get achievement by ID"""
        return self.achievements.find_one({'_id': ObjectId(achievement_id)})

    def award_achievement(self, learner_id: str, achievement_id: str) -> bool:
        """Award an achievement to a learner"""
        try:
            self.learner_achievements.insert_one({
                'learner_id': ObjectId(learner_id),
                'achievement_id': ObjectId(achievement_id),
                'earned_at': datetime.utcnow()
            })

            # Add XP reward
            achievement = self.get_achievement(achievement_id)
            if achievement and achievement.get('xp_reward'):
                self.add_xp(learner_id, achievement['xp_reward'])

            return True
        except:
            return False

    def get_learner_achievements(self, learner_id: str) -> List[Dict]:
        """Get all achievements earned by a learner"""
        earned = list(self.learner_achievements.find({
            'learner_id': ObjectId(learner_id)
        }))
        achievement_ids = [e['achievement_id'] for e in earned]
        achievements = list(self.achievements.find({
            '_id': {'$in': achievement_ids}
        }))

        # Merge earned_at timestamp
        achievement_map = {str(a['_id']): a for a in achievements}
        for e in earned:
            aid = str(e['achievement_id'])
            if aid in achievement_map:
                achievement_map[aid]['earned_at'] = e['earned_at']

        return list(achievement_map.values())

    # ========== DAILY PROGRESS METHODS ==========

    def update_daily_progress(self, learner_id: str, date_obj: date,
                              xp_earned: int = 0, lessons_completed: int = 0,
                              minutes_practiced: int = 0) -> bool:
        """Update daily progress for a learner"""
        # Get learner's daily goal
        learner = self.get_learner_by_id(learner_id)
        daily_goal = learner.get('daily_goal_minutes', 10) if learner else 10

        # Convert date to datetime for MongoDB storage
        if isinstance(date_obj, date):
            date_datetime = datetime.combine(date_obj, datetime.min.time())
        else:
            date_datetime = date_obj

        # Check if document exists
        existing = self.daily_progress.find_one({
            'learner_id': ObjectId(learner_id),
            'date': date_datetime
        })
        
        if existing:
            # Update existing document
            result = self.daily_progress.update_one(
                {
                    'learner_id': ObjectId(learner_id),
                    'date': date_datetime
                },
                {
                    '$inc': {
                        'xp_earned': xp_earned,
                        'lessons_completed': lessons_completed,
                        'minutes_practiced': minutes_practiced
                    }
                }
            )
        else:
            # Insert new document
            result = self.daily_progress.update_one(
                {
                    'learner_id': ObjectId(learner_id),
                    'date': date_datetime
                },
                {
                    '$set': {
                        'xp_earned': xp_earned,
                        'lessons_completed': lessons_completed,
                        'minutes_practiced': minutes_practiced,
                        'goal_met': False
                    }
                },
                upsert=True
            )

        # Check if goal met
        progress = self.daily_progress.find_one({
            'learner_id': ObjectId(learner_id),
            'date': date_datetime
        })
        if progress and progress.get('minutes_practiced', 0) >= daily_goal:
            self.daily_progress.update_one(
                {'_id': progress['_id']},
                {'$set': {'goal_met': True}}
            )

        return True

    def get_daily_progress(self, learner_id: str, days: int = 30) -> List[Dict]:
        """Get daily progress for the last N days"""
        return list(self.daily_progress.find({
            'learner_id': ObjectId(learner_id)
        }).sort('date', DESCENDING).limit(days))

    # ========== VOICE RESPONSE METHODS ==========

    def create_voice_response(
        self,
        learner_id: str,
        kc_id: str,
        transcription: str,
        **kwargs
    ) -> str:
        """
        Create a voice response record

        Args:
            learner_id: Learner ID
            kc_id: Knowledge component ID
            transcription: Transcribed text
            **kwargs: Additional fields (audio_url, confidence, etc.)

        Returns:
            Voice response ID
        """
        voice_response = {
            'learner_id': ObjectId(learner_id),
            'kc_id': ObjectId(kc_id),
            'interaction_id': kwargs.get('interaction_id'),
            'audio_url': kwargs.get('audio_url'),
            'duration_ms': kwargs.get('duration_ms', 0),
            'transcription': transcription,
            'transcription_confidence': kwargs.get('transcription_confidence', 0.0),
            'detected_language': kwargs.get('detected_language', 'en'),
            'semantic_similarity': kwargs.get('semantic_similarity', 0.0),
            'matched_choice': kwargs.get('matched_choice'),
            'similarity_scores': kwargs.get('similarity_scores', {}),
            'hesitation_ms': kwargs.get('hesitation_ms', 0),
            'speech_pace_wpm': kwargs.get('speech_pace_wpm', 0),
            'confidence_score': kwargs.get('confidence_score', 0.0),
            'filler_words_count': kwargs.get('filler_words_count', 0),
            'false_starts': kwargs.get('false_starts', 0),
            'is_correct': kwargs.get('is_correct', False),
            'created_at': datetime.utcnow()
        }
        result = self.voice_responses.insert_one(voice_response)
        return str(result.inserted_id)

    def get_voice_response(self, voice_response_id: str) -> Optional[Dict]:
        """Get voice response by ID"""
        return self.voice_responses.find_one({'_id': ObjectId(voice_response_id)})

    def update_voice_response(self, voice_response_id: str, updates: Dict) -> bool:
        """Update voice response"""
        result = self.voice_responses.update_one(
            {'_id': ObjectId(voice_response_id)},
            {'$set': updates}
        )
        return result.modified_count > 0

    def get_learner_voice_responses(self, learner_id: str, limit: int = 50) -> List[Dict]:
        """Get recent voice responses for a learner"""
        return list(self.voice_responses.find({
            'learner_id': ObjectId(learner_id)
        }).sort('created_at', DESCENDING).limit(limit))

    # ========== MEDIA ASSETS METHODS ==========

    def create_media_asset(
        self,
        asset_id: str,
        asset_type: str,
        urls: Dict[str, str],
        **kwargs
    ) -> str:
        """
        Create a media asset record

        Args:
            asset_id: Unique asset identifier (e.g., "img-us-coins")
            asset_type: Type of media (image, animation, lottie, video, calculator, etc.)
            urls: Dictionary of URLs (original, thumbnail, mobile, etc.)
            **kwargs: Additional fields (alt_text, caption, dimensions, etc.)

        Returns:
            Media asset MongoDB ID
        """
        media_asset = {
            'asset_id': asset_id,
            'type': asset_type,
            'urls': urls,
            'alt_text': kwargs.get('alt_text', ''),
            'caption': kwargs.get('caption'),
            'dimensions': kwargs.get('dimensions'),  # {width: int, height: int}
            'file_size': kwargs.get('file_size'),  # bytes
            'mime_type': kwargs.get('mime_type'),
            'tags': kwargs.get('tags', []),
            'used_in': kwargs.get('used_in', []),  # lesson IDs or question IDs
            'component_name': kwargs.get('component_name'),  # For interactive components
            'component_props': kwargs.get('component_props'),  # Props for components
            'is_active': kwargs.get('is_active', True),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = self.media_assets.insert_one(media_asset)
        return str(result.inserted_id)

    def get_media_asset(self, asset_id: str) -> Optional[Dict]:
        """Get media asset by asset_id"""
        return self.media_assets.find_one({'asset_id': asset_id})

    def get_media_asset_by_mongo_id(self, mongo_id: str) -> Optional[Dict]:
        """Get media asset by MongoDB _id"""
        return self.media_assets.find_one({'_id': ObjectId(mongo_id)})

    def update_media_asset(self, asset_id: str, updates: Dict) -> bool:
        """Update media asset"""
        updates['updated_at'] = datetime.utcnow()
        result = self.media_assets.update_one(
            {'asset_id': asset_id},
            {'$set': updates}
        )
        return result.modified_count > 0

    def get_media_assets_by_type(self, asset_type: str) -> List[Dict]:
        """Get all media assets of a specific type"""
        return list(self.media_assets.find({'type': asset_type, 'is_active': True}))

    def get_media_assets_by_tags(self, tags: List[str]) -> List[Dict]:
        """Get media assets that have any of the specified tags"""
        return list(self.media_assets.find({
            'tags': {'$in': tags},
            'is_active': True
        }))

    def get_media_assets_for_lesson(self, lesson_id: str) -> List[Dict]:
        """Get all media assets used in a specific lesson"""
        return list(self.media_assets.find({
            'used_in': lesson_id,
            'is_active': True
        }))

    def delete_media_asset(self, asset_id: str) -> bool:
        """Soft delete media asset by marking it inactive"""
        return self.update_media_asset(asset_id, {'is_active': False})

    def get_all_media_assets(self, active_only: bool = True) -> List[Dict]:
        """Get all media assets"""
        query = {'is_active': True} if active_only else {}
        return list(self.media_assets.find(query).sort('created_at', DESCENDING))
