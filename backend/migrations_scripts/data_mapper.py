"""
Data mapper for MongoDB to PostgreSQL migration
Maps MongoDB documents to PostgreSQL SQLAlchemy models
"""
from typing import Dict, Any, Optional, List
from datetime import datetime, date
import uuid
from migration_utils import DataTransformer, MigrationValidator, logger


class MongoToPostgresMapper:
    """Maps MongoDB documents to PostgreSQL model dictionaries"""

    def __init__(self):
        self.transformer = DataTransformer()
        self.validator = MigrationValidator()

    def map_learner(self, mongo_doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Map MongoDB user document to Learner model

        Expected MongoDB format:
        {
            "_id": ObjectId,
            "email": str,
            "display_name": str,
            "profile": {
                "native_language": str,
                "english_proficiency": str,
                "immigration_status": str,
                "country_of_origin": str,
                "visa_type": str,
                "has_ssn": bool,
                "sends_remittances": bool,
                "financial_goals": []
            },
            "gamification": {
                "total_xp": int,
                "streak_count": int,
                "streak_last_date": datetime,
                "daily_goal_minutes": int
            },
            "financial_experience_level": str,
            "timezone": str,
            "created_at": datetime,
            "last_active_at": datetime
        }
        """
        try:
            # Extract profile and gamification nested documents
            profile = self.transformer.ensure_dict(mongo_doc.get('profile', {}))
            gamification = self.transformer.ensure_dict(mongo_doc.get('gamification', {}))

            # Build PostgreSQL model data
            pg_data = {
                'learner_id': self.transformer.convert_object_id_to_uuid(mongo_doc.get('_id')),
                'email': self.transformer.clean_string(mongo_doc.get('email'), 255),
                'display_name': self.transformer.clean_string(mongo_doc.get('display_name'), 255),
                'native_language': self.transformer.clean_string(profile.get('native_language'), 50),
                'english_proficiency': self.transformer.clean_string(
                    profile.get('english_proficiency', 'intermediate'), 50
                ),
                'immigration_status': self.transformer.clean_string(profile.get('immigration_status'), 50),
                'financial_experience_level': self.transformer.clean_string(
                    mongo_doc.get('financial_experience_level', 'novice'), 50
                ),
                'daily_goal_minutes': self.transformer.convert_integer(
                    gamification.get('daily_goal_minutes', 10)
                ) or 10,
                'timezone': self.transformer.clean_string(
                    mongo_doc.get('timezone', 'America/New_York'), 50
                ),
                'streak_count': self.transformer.convert_integer(gamification.get('streak_count', 0)) or 0,
                'streak_last_date': self.transformer.convert_datetime(gamification.get('streak_last_date')),
                'total_xp': self.transformer.convert_integer(gamification.get('total_xp', 0)) or 0,
                'country_of_origin': self.transformer.clean_string(profile.get('country_of_origin'), 100),
                'visa_type': self.transformer.clean_string(profile.get('visa_type'), 50),
                'has_ssn': self.transformer.convert_boolean(profile.get('has_ssn')),
                'sends_remittances': self.transformer.convert_boolean(profile.get('sends_remittances')),
                'financial_goals': self.transformer.ensure_dict(profile.get('financial_goals', {})),
                'created_at': self.transformer.convert_datetime(mongo_doc.get('created_at')) or datetime.utcnow(),
                'last_active_at': self.transformer.convert_datetime(mongo_doc.get('last_active_at'))
            }

            # Validate required fields
            if not self.validator.validate_email(pg_data['email']):
                logger.warning(f"Invalid email: {pg_data['email']}")
                return None

            return pg_data

        except Exception as e:
            logger.error(f"Error mapping learner: {str(e)}")
            return None

    def map_knowledge_component(self, mongo_doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Map MongoDB knowledge component to KnowledgeComponent model

        Expected MongoDB format:
        {
            "_id": ObjectId,
            "slug": str,
            "name": str,
            "description": str,
            "domain": str,
            "parent_kc_id": ObjectId (optional),
            "difficulty_tier": int,
            "bloom_level": str,
            "estimated_minutes": int,
            "icon_url": str,
            "is_active": bool,
            "created_at": datetime
        }
        """
        try:
            pg_data = {
                'kc_id': self.transformer.convert_object_id_to_uuid(mongo_doc.get('_id')),
                'slug': self.transformer.clean_string(mongo_doc.get('slug'), 100),
                'name': self.transformer.clean_string(mongo_doc.get('name'), 255),
                'description': self.transformer.clean_string(mongo_doc.get('description')),
                'domain': self.transformer.clean_string(mongo_doc.get('domain'), 50),
                'parent_kc_id': self.transformer.convert_object_id_to_uuid(mongo_doc.get('parent_kc_id')),
                'difficulty_tier': self.transformer.convert_integer(mongo_doc.get('difficulty_tier', 1)) or 1,
                'bloom_level': self.transformer.clean_string(mongo_doc.get('bloom_level'), 20),
                'estimated_minutes': self.transformer.convert_integer(mongo_doc.get('estimated_minutes', 15)) or 15,
                'icon_url': self.transformer.clean_string(mongo_doc.get('icon_url'), 500),
                'is_active': self.transformer.convert_boolean(mongo_doc.get('is_active', True)),
                'created_at': self.transformer.convert_datetime(mongo_doc.get('created_at')) or datetime.utcnow()
            }

            # Validate required fields
            if not pg_data['slug'] or not pg_data['name'] or not pg_data['domain']:
                logger.warning(f"Missing required KC fields: {mongo_doc.get('_id')}")
                return None

            return pg_data

        except Exception as e:
            logger.error(f"Error mapping knowledge component: {str(e)}")
            return None

    def map_learning_item(self, mongo_doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Map MongoDB learning item to LearningItem model"""
        try:
            pg_data = {
                'item_id': self.transformer.convert_object_id_to_uuid(mongo_doc.get('_id')),
                'item_type': self.transformer.clean_string(mongo_doc.get('item_type'), 30),
                'content': self.transformer.ensure_dict(mongo_doc.get('content', {})),
                'difficulty': self.transformer.convert_float(mongo_doc.get('difficulty', 0.5)) or 0.5,
                'discrimination': self.transformer.convert_float(mongo_doc.get('discrimination', 1.0)) or 1.0,
                'response_count': self.transformer.convert_integer(mongo_doc.get('response_count', 0)) or 0,
                'correct_rate': self.transformer.convert_float(mongo_doc.get('correct_rate')),
                'avg_response_time_ms': self.transformer.convert_integer(mongo_doc.get('avg_response_time_ms')),
                'media_type': self.transformer.clean_string(mongo_doc.get('media_type'), 20),
                'media_url': self.transformer.clean_string(mongo_doc.get('media_url'), 500),
                'allows_llm_personalization': self.transformer.convert_boolean(
                    mongo_doc.get('allows_llm_personalization', True)
                ),
                'forgetting_curve_factor': self.transformer.convert_float(
                    mongo_doc.get('forgetting_curve_factor', 1.0)
                ) or 1.0,
                'is_active': self.transformer.convert_boolean(mongo_doc.get('is_active', True)),
                'created_at': self.transformer.convert_datetime(mongo_doc.get('created_at')) or datetime.utcnow(),
                'updated_at': self.transformer.convert_datetime(mongo_doc.get('updated_at')) or datetime.utcnow()
            }

            if not pg_data['item_type']:
                logger.warning(f"Missing item_type: {mongo_doc.get('_id')}")
                return None

            return pg_data

        except Exception as e:
            logger.error(f"Error mapping learning item: {str(e)}")
            return None

    def map_item_kc_mapping(self, mongo_doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Map MongoDB item-KC relationship to ItemKCMapping model"""
        try:
            pg_data = {
                'item_id': self.transformer.convert_object_id_to_uuid(mongo_doc.get('item_id')),
                'kc_id': self.transformer.convert_object_id_to_uuid(mongo_doc.get('kc_id')),
                'weight': self.transformer.convert_float(mongo_doc.get('weight', 1.0)) or 1.0
            }

            if not pg_data['item_id'] or not pg_data['kc_id']:
                logger.warning(f"Missing IDs in item-KC mapping")
                return None

            return pg_data

        except Exception as e:
            logger.error(f"Error mapping item-KC mapping: {str(e)}")
            return None

    def map_learner_skill_state(self, mongo_doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Map MongoDB learner skill state to LearnerSkillState model"""
        try:
            pg_data = {
                'learner_id': self.transformer.convert_object_id_to_uuid(mongo_doc.get('learner_id')),
                'kc_id': self.transformer.convert_object_id_to_uuid(mongo_doc.get('kc_id')),
                'p_mastery': self.transformer.convert_float(mongo_doc.get('p_mastery', 0.1)) or 0.1,
                'stability_days': self.transformer.convert_float(mongo_doc.get('stability_days', 1.0)) or 1.0,
                'difficulty': self.transformer.convert_float(mongo_doc.get('difficulty', 0.3)) or 0.3,
                'retrievability': self.transformer.convert_float(mongo_doc.get('retrievability', 1.0)) or 1.0,
                'total_attempts': self.transformer.convert_integer(mongo_doc.get('total_attempts', 0)) or 0,
                'correct_count': self.transformer.convert_integer(mongo_doc.get('correct_count', 0)) or 0,
                'current_streak': self.transformer.convert_integer(mongo_doc.get('current_streak', 0)) or 0,
                'best_streak': self.transformer.convert_integer(mongo_doc.get('best_streak', 0)) or 0,
                'last_practiced_at': self.transformer.convert_datetime(mongo_doc.get('last_practiced_at')),
                'next_review_at': self.transformer.convert_datetime(mongo_doc.get('next_review_at')),
                'interval_days': self.transformer.convert_integer(mongo_doc.get('interval_days', 1)) or 1,
                'status': self.transformer.clean_string(mongo_doc.get('status', 'locked'), 20),
                'unlocked_at': self.transformer.convert_datetime(mongo_doc.get('unlocked_at')),
                'mastered_at': self.transformer.convert_datetime(mongo_doc.get('mastered_at')),
                'updated_at': self.transformer.convert_datetime(mongo_doc.get('updated_at')) or datetime.utcnow()
            }

            if not pg_data['learner_id'] or not pg_data['kc_id']:
                logger.warning(f"Missing IDs in learner skill state")
                return None

            return pg_data

        except Exception as e:
            logger.error(f"Error mapping learner skill state: {str(e)}")
            return None

    def map_interaction(self, mongo_doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Map MongoDB interaction to Interaction model"""
        try:
            pg_data = {
                'interaction_id': self.transformer.convert_object_id_to_uuid(mongo_doc.get('_id')),
                'learner_id': self.transformer.convert_object_id_to_uuid(mongo_doc.get('learner_id')),
                'item_id': self.transformer.convert_object_id_to_uuid(mongo_doc.get('item_id')),
                'kc_id': self.transformer.convert_object_id_to_uuid(mongo_doc.get('kc_id')),
                'session_id': self.transformer.convert_object_id_to_uuid(mongo_doc.get('session_id')),
                'is_correct': self.transformer.convert_boolean(mongo_doc.get('is_correct')),
                'response_value': self.transformer.ensure_dict(mongo_doc.get('response_value', {})),
                'response_time_ms': self.transformer.convert_integer(mongo_doc.get('response_time_ms')),
                'hint_used': self.transformer.convert_boolean(mongo_doc.get('hint_used', False)),
                'p_mastery_before': self.transformer.convert_float(mongo_doc.get('p_mastery_before')),
                'retrievability_before': self.transformer.convert_float(mongo_doc.get('retrievability_before')),
                'days_since_last_review': self.transformer.convert_float(mongo_doc.get('days_since_last_review')),
                'selection_method': self.transformer.clean_string(mongo_doc.get('selection_method'), 30),
                'predicted_p_correct': self.transformer.convert_float(mongo_doc.get('predicted_p_correct')),
                'created_at': self.transformer.convert_datetime(mongo_doc.get('created_at')) or datetime.utcnow()
            }

            if not all([pg_data['learner_id'], pg_data['item_id'], pg_data['kc_id'], pg_data['session_id']]):
                logger.warning(f"Missing required IDs in interaction")
                return None

            if pg_data['is_correct'] is None:
                logger.warning(f"Missing is_correct in interaction")
                return None

            return pg_data

        except Exception as e:
            logger.error(f"Error mapping interaction: {str(e)}")
            return None

    def map_achievement(self, mongo_doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Map MongoDB achievement to Achievement model"""
        try:
            pg_data = {
                'achievement_id': self.transformer.convert_object_id_to_uuid(mongo_doc.get('_id')),
                'slug': self.transformer.clean_string(mongo_doc.get('slug'), 100),
                'name': self.transformer.clean_string(mongo_doc.get('name'), 100),
                'description': self.transformer.clean_string(mongo_doc.get('description')),
                'icon_url': self.transformer.clean_string(mongo_doc.get('icon_url'), 500),
                'xp_reward': self.transformer.convert_integer(mongo_doc.get('xp_reward', 0)) or 0,
                'criteria': self.transformer.ensure_dict(mongo_doc.get('criteria', {}))
            }

            if not pg_data['slug'] or not pg_data['name']:
                logger.warning(f"Missing required achievement fields")
                return None

            return pg_data

        except Exception as e:
            logger.error(f"Error mapping achievement: {str(e)}")
            return None

    def map_learner_achievement(self, mongo_doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Map MongoDB learner achievement to LearnerAchievement model"""
        try:
            pg_data = {
                'learner_id': self.transformer.convert_object_id_to_uuid(mongo_doc.get('learner_id')),
                'achievement_id': self.transformer.convert_object_id_to_uuid(mongo_doc.get('achievement_id')),
                'earned_at': self.transformer.convert_datetime(mongo_doc.get('earned_at')) or datetime.utcnow()
            }

            if not pg_data['learner_id'] or not pg_data['achievement_id']:
                logger.warning(f"Missing IDs in learner achievement")
                return None

            return pg_data

        except Exception as e:
            logger.error(f"Error mapping learner achievement: {str(e)}")
            return None

    def map_daily_progress(self, mongo_doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Map MongoDB daily progress to DailyProgress model"""
        try:
            # Handle date conversion
            date_value = mongo_doc.get('date')
            if isinstance(date_value, datetime):
                date_value = date_value.date()
            elif isinstance(date_value, str):
                try:
                    date_value = datetime.fromisoformat(date_value).date()
                except:
                    date_value = date.today()
            else:
                date_value = date.today()

            pg_data = {
                'learner_id': self.transformer.convert_object_id_to_uuid(mongo_doc.get('learner_id')),
                'date': date_value,
                'xp_earned': self.transformer.convert_integer(mongo_doc.get('xp_earned', 0)) or 0,
                'lessons_completed': self.transformer.convert_integer(mongo_doc.get('lessons_completed', 0)) or 0,
                'minutes_practiced': self.transformer.convert_integer(mongo_doc.get('minutes_practiced', 0)) or 0,
                'goal_met': self.transformer.convert_boolean(mongo_doc.get('goal_met', False))
            }

            if not pg_data['learner_id']:
                logger.warning(f"Missing learner_id in daily progress")
                return None

            return pg_data

        except Exception as e:
            logger.error(f"Error mapping daily progress: {str(e)}")
            return None
