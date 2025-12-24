"""
Learning Engine - Integrated Adaptive Learning Service

This module provides a unified interface to all adaptive learning algorithms.
It combines BKT, FSRS, IRT, and content selection into a single easy-to-use service.
"""

from typing import Dict, List, Optional
from datetime import datetime
from .bkt import BayesianKnowledgeTracer, BKTParams
from .scheduler import FSRSScheduler
from .irt import IRTCalibrator
from .content_selector import ContentSelector


class LearningEngine:
    """
    Unified adaptive learning engine

    Provides high-level interface for:
    - Getting next learning item
    - Recording learner interactions
    - Tracking mastery and progress
    - Scheduling reviews
    - Calibrating content difficulty
    """

    def __init__(self, db_collections):
        """
        Initialize learning engine with all services

        Args:
            db_collections: FinLitCollections instance
        """
        self.collections = db_collections

        # Initialize all services
        self.bkt = BayesianKnowledgeTracer(db_collections)
        self.fsrs = FSRSScheduler(db_collections)
        self.irt = IRTCalibrator(db_collections)
        self.selector = ContentSelector(db_collections, self.bkt, self.fsrs, self.irt)

    # ===== High-level learning flow methods =====

    def get_next_item(self, learner_id: str, kc_id: Optional[str] = None) -> Optional[Dict]:
        """
        Get the next optimal learning item for a learner

        This is the main entry point for adaptive learning sessions.

        Args:
            learner_id: Learner ID
            kc_id: Optional specific KC (auto-selects if None)

        Returns:
            Dict with item, KC, predictions, and metadata
        """
        return self.selector.select_next_item(learner_id, kc_id)

    def create_learning_session(self, learner_id: str, target_items: int = 5) -> List[Dict]:
        """
        Create a complete learning session with multiple items

        Args:
            learner_id: Learner ID
            target_items: Number of items to include (default 5)

        Returns:
            List of selected items for the session
        """
        return self.selector.get_learning_session(learner_id, target_items)

    def submit_answer(self, learner_id: str, item_id: str, kc_id: str,
                     is_correct: bool, response_value: Dict,
                     response_time_ms: int, hint_used: bool = False,
                     session_id: Optional[str] = None) -> Dict:
        """
        Submit learner answer and update all models

        This method:
        1. Records the interaction
        2. Updates BKT mastery
        3. Updates FSRS schedule
        4. Updates item statistics

        Args:
            learner_id: Learner ID
            item_id: Learning item ID
            kc_id: Knowledge component ID
            is_correct: Whether answer was correct
            response_value: Learner's response data
            response_time_ms: Response time in milliseconds
            hint_used: Whether hint was used
            session_id: Session ID (generates if None)

        Returns:
            Dict with all updates and next predictions
        """
        result = self.selector.record_interaction_and_update(
            learner_id=learner_id,
            item_id=item_id,
            kc_id=kc_id,
            is_correct=is_correct,
            response_value=response_value,
            response_time_ms=response_time_ms,
            hint_used=hint_used,
            session_id=session_id
        )

        # Add XP reward
        xp_earned = self._calculate_xp_reward(is_correct, hint_used, response_time_ms)
        self.collections.add_xp(learner_id, xp_earned)
        result['xp_earned'] = xp_earned

        # Update daily progress
        from datetime import datetime
        self.collections.update_daily_progress(
            learner_id=learner_id,
            date_obj=datetime.now().date(),
            xp_earned=xp_earned,
            lessons_completed=0,  # Incremented separately
            minutes_practiced=int(response_time_ms / 60000)
        )

        # Update streak if appropriate
        self.collections.update_streak(learner_id, increment=True)

        return result

    # ===== Mastery and progress tracking =====

    def get_mastery_overview(self, learner_id: str) -> Dict:
        """
        Get comprehensive mastery overview for a learner

        Args:
            learner_id: Learner ID

        Returns:
            Dict with mastery statistics across all KCs
        """
        skill_states = self.collections.learner_skill_states.find({
            'learner_id': self.collections._to_object_id(learner_id)
        })

        stats = {
            'total_kcs': 0,
            'mastered': 0,
            'in_progress': 0,
            'available': 0,
            'locked': 0,
            'avg_mastery': 0.0,
            'kcs': []
        }

        mastery_values = []

        for state in skill_states:
            stats['total_kcs'] += 1
            status = state.get('status', 'locked')
            stats[status] = stats.get(status, 0) + 1

            p_mastery = state.get('p_mastery', 0.0)
            mastery_values.append(p_mastery)

            # Get KC details
            kc = self.collections.knowledge_components.find_one({'_id': state['kc_id']})

            stats['kcs'].append({
                'kc_id': str(state['kc_id']),
                'kc_name': kc.get('name') if kc else 'Unknown',
                'status': status,
                'p_mastery': p_mastery,
                'total_attempts': state.get('total_attempts', 0),
                'correct_count': state.get('correct_count', 0)
            })

        if mastery_values:
            stats['avg_mastery'] = sum(mastery_values) / len(mastery_values)

        return stats

    def get_learning_path(self, learner_id: str) -> List[Dict]:
        """
        Get recommended learning path for a learner

        Returns KCs in suggested order considering:
        - Prerequisites
        - Current mastery
        - Difficulty progression

        Args:
            learner_id: Learner ID

        Returns:
            Ordered list of KCs to study
        """
        # Get all available KCs
        available = self.selector.get_available_kcs(learner_id)

        # Get due reviews
        due_reviews = self.fsrs.get_due_reviews(learner_id)

        path = []

        # 1. Add due reviews first (highest priority)
        for review in due_reviews[:3]:  # Top 3 most urgent
            kc = self.collections.knowledge_components.find_one({
                '_id': self.collections._to_object_id(review['kc_id'])
            })
            if kc:
                path.append({
                    'kc_id': review['kc_id'],
                    'kc_name': kc.get('name'),
                    'reason': 'review_due',
                    'priority': 'high',
                    'retrievability': review['retrievability']
                })

        # 2. Add in-progress KCs (continue learning)
        in_progress = [kc for kc in available if kc['skill_state'].get('status') == 'in_progress']
        in_progress.sort(key=lambda x: x['skill_state'].get('p_mastery', 0.0))

        for kc_data in in_progress[:3]:
            path.append({
                'kc_id': kc_data['kc_id'],
                'kc_name': kc_data['kc'].get('name'),
                'reason': 'in_progress',
                'priority': 'medium',
                'p_mastery': kc_data['skill_state'].get('p_mastery', 0.0)
            })

        # 3. Add new available KCs
        new_kcs = [kc for kc in available if kc['skill_state'].get('status') == 'available']

        for kc_data in new_kcs[:2]:
            path.append({
                'kc_id': kc_data['kc_id'],
                'kc_name': kc_data['kc'].get('name'),
                'reason': 'new_topic',
                'priority': 'low',
                'difficulty_tier': kc_data['kc'].get('difficulty_tier', 1)
            })

        return path

    # ===== Review and scheduling =====

    def get_review_schedule(self, learner_id: str, days_ahead: int = 7) -> Dict:
        """
        Get review schedule for upcoming days

        Args:
            learner_id: Learner ID
            days_ahead: Number of days to look ahead

        Returns:
            Dict with due and upcoming reviews
        """
        due = self.fsrs.get_due_reviews(learner_id)
        upcoming = self.fsrs.get_upcoming_reviews(learner_id, days_ahead)

        return {
            'due_now': len(due),
            'due_items': due,
            'upcoming': upcoming,
            'total_upcoming': len(upcoming)
        }

    # ===== Analytics and reporting =====

    def get_learner_analytics(self, learner_id: str) -> Dict:
        """
        Get comprehensive analytics for a learner

        Args:
            learner_id: Learner ID

        Returns:
            Dict with performance metrics and trends
        """
        # Get learner profile
        learner = self.collections.learners.find_one({
            '_id': self.collections._to_object_id(learner_id)
        })

        if not learner:
            return {}

        # Get mastery overview
        mastery = self.get_mastery_overview(learner_id)

        # Get recent interactions
        recent_interactions = list(self.collections.interactions.find({
            'learner_id': self.collections._to_object_id(learner_id)
        }).sort('created_at', -1).limit(20))

        # Calculate accuracy
        if recent_interactions:
            correct_count = sum(1 for i in recent_interactions if i.get('is_correct', False))
            accuracy = correct_count / len(recent_interactions)
        else:
            accuracy = 0.0

        # Get ability estimate
        ability = self.irt.estimate_ability(learner_id)

        # Get daily progress
        daily_progress = list(self.collections.daily_progress.find({
            'learner_id': self.collections._to_object_id(learner_id)
        }).sort('date', -1).limit(7))

        return {
            'learner_id': learner_id,
            'display_name': learner.get('display_name'),
            'total_xp': learner.get('total_xp', 0),
            'streak_count': learner.get('streak_count', 0),
            'mastery_overview': mastery,
            'recent_accuracy': accuracy,
            'estimated_ability': ability,
            'total_interactions': len(recent_interactions),
            'daily_progress': daily_progress
        }

    # ===== Content calibration =====

    def calibrate_item(self, item_id: str) -> Dict:
        """
        Calibrate a single item's difficulty parameters

        Args:
            item_id: Learning item ID

        Returns:
            Calibration results
        """
        return self.irt.update_item_parameters(item_id)

    def calibrate_all_items(self, min_responses: int = 10) -> List[Dict]:
        """
        Calibrate all items with sufficient data

        Args:
            min_responses: Minimum responses needed for calibration

        Returns:
            List of calibration results
        """
        return self.irt.calibrate_all_items(min_responses)

    # ===== Utility methods =====

    def _calculate_xp_reward(self, is_correct: bool, hint_used: bool,
                           response_time_ms: int) -> int:
        """
        Calculate XP reward for an interaction

        Args:
            is_correct: Whether answer was correct
            hint_used: Whether hint was used
            response_time_ms: Response time in milliseconds

        Returns:
            XP amount
        """
        if not is_correct:
            return 5  # Participation XP

        base_xp = 20

        # Bonus for not using hints
        if not hint_used:
            base_xp += 10

        # Bonus for quick responses (under 10 seconds)
        if response_time_ms < 10000:
            base_xp += 5

        return base_xp

    def initialize_learner_kcs(self, learner_id: str) -> int:
        """
        Initialize all KCs for a new learner

        Creates skill states for all tier-1 KCs

        Args:
            learner_id: Learner ID

        Returns:
            Number of KCs initialized
        """
        # Get all tier-1 KCs (entry level)
        tier1_kcs = self.collections.knowledge_components.find({
            'difficulty_tier': 1
        })

        count = 0
        for kc in tier1_kcs:
            try:
                self.bkt.initialize_skill_state(learner_id, str(kc['_id']))
                count += 1
            except Exception:
                pass  # Skip if already exists

        return count

    def check_achievements(self, learner_id: str) -> List[Dict]:
        """
        Check and award any newly earned achievements.

        Delegates to AchievementService for comprehensive achievement logic.

        Args:
            learner_id: Learner ID

        Returns:
            List of newly awarded achievements
        """
        from services.achievements import AchievementService

        service = AchievementService(self.collections)
        newly_earned = service.check_achievements(learner_id)

        return newly_earned
