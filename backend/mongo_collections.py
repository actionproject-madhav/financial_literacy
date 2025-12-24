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

    def create_indexes(self):
        """Create all indexes for optimal query performance"""
        print("Creating MongoDB indexes for FinLit collections...")

        # Learners indexes
        self.learners.create_index([("email", ASCENDING)], unique=True)
        self.learners.create_index([("created_at", DESCENDING)])

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

        print("✅ All indexes created successfully!")

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
            'country_of_origin': kwargs.get('country_of_origin'),
            'visa_type': kwargs.get('visa_type'),
            'has_ssn': kwargs.get('has_ssn'),
            'sends_remittances': kwargs.get('sends_remittances'),
            'financial_goals': kwargs.get('financial_goals', []),
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
        today = date.today()
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
        """Add XP to learner"""
        result = self.learners.update_one(
            {'_id': ObjectId(learner_id)},
            {'$inc': {'total_xp': xp_amount}}
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

        new_count = item['response_count'] + 1
        old_correct = item.get('correct_rate', 0.5) * item['response_count']
        new_correct_rate = (old_correct + (1 if is_correct else 0)) / new_count

        # Update average response time
        old_avg = item.get('avg_response_time_ms', response_time_ms)
        new_avg = ((old_avg * item['response_count']) + response_time_ms) / new_count

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

        result = self.daily_progress.update_one(
            {
                'learner_id': ObjectId(learner_id),
                'date': date_obj
            },
            {
                '$inc': {
                    'xp_earned': xp_earned,
                    'lessons_completed': lessons_completed,
                    'minutes_practiced': minutes_practiced
                }
            },
            upsert=True
        )

        # Check if goal met
        progress = self.daily_progress.find_one({
            'learner_id': ObjectId(learner_id),
            'date': date_obj
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
