"""
Content Selection Service

This module implements intelligent content selection for adaptive learning.
Combines BKT mastery tracking, FSRS scheduling, and IRT difficulty matching
to select optimal learning items for each learner.
"""

from typing import List, Dict, Optional
from bson import ObjectId
from datetime import datetime
import random
import math


class ContentSelector:
    """
    Implements adaptive content selection algorithm

    Combines multiple algorithms to select optimal learning items:
    - BKT for mastery tracking
    - FSRS for spaced repetition timing
    - IRT for difficulty matching
    - Thompson Sampling for exploration
    """

    # Selection constants
    OPTIMAL_DIFFICULTY_RANGE = 0.6  # Target p(correct) = 0.6 (zone of proximal development)
    DIFFICULTY_TOLERANCE = 0.2      # Accept items within ±0.2 of target
    EXPLORATION_RATE = 0.1          # 10% chance to explore non-optimal items
    MAX_CANDIDATES = 50             # Maximum items to consider

    def __init__(self, db_collections, bkt_service, fsrs_scheduler, irt_calibrator):
        """
        Initialize content selector

        Args:
            db_collections: FinLitCollections instance
            bkt_service: BayesianKnowledgeTracer instance
            fsrs_scheduler: FSRSScheduler instance
            irt_calibrator: IRTCalibrator instance
        """
        self.collections = db_collections
        self.bkt = bkt_service
        self.fsrs = fsrs_scheduler
        self.irt = irt_calibrator

    def get_available_kcs(self, learner_id: str) -> List[Dict]:
        """
        Get all KCs available for learning (not locked)

        Args:
            learner_id: Learner ID

        Returns:
            List of available KC documents with skill states
        """
        skill_states = self.collections.learner_skill_states.find({
            'learner_id': ObjectId(learner_id),
            'status': {'$in': ['available', 'in_progress', 'mastered']}
        })

        results = []
        for state in skill_states:
            kc = self.collections.knowledge_components.find_one({
                '_id': state['kc_id']
            })

            if kc:
                results.append({
                    'kc_id': str(kc['_id']),
                    'kc': kc,
                    'skill_state': state
                })

        return results

    def should_review(self, learner_id: str, kc_id: str) -> bool:
        """
        Check if KC is due for spaced repetition review

        Args:
            learner_id: Learner ID
            kc_id: Knowledge component ID

        Returns:
            True if review is due
        """
        skill_state = self.collections.learner_skill_states.find_one({
            'learner_id': ObjectId(learner_id),
            'kc_id': ObjectId(kc_id)
        })

        if not skill_state:
            return False

        next_review = skill_state.get('next_review_at')
        if not next_review:
            return False

        return datetime.utcnow() >= next_review

    def get_items_for_kc(self, kc_id: str, learner_id: Optional[str] = None) -> List[Dict]:
        """
        Get all learning items for a KC, sorted by suitability

        Args:
            kc_id: Knowledge component ID
            learner_id: Learner ID (for personalization)

        Returns:
            List of items with predicted difficulty
        """
        # Get item-KC mappings
        mappings = self.collections.item_kc_mappings.find({
            'kc_id': ObjectId(kc_id)
        })

        item_ids = [m['item_id'] for m in mappings]

        if not item_ids:
            return []

        # Get items
        items = self.collections.learning_items.find({
            '_id': {'$in': item_ids}
        })

        results = []
        for item in items:
            item_data = {
                'item_id': str(item['_id']),
                'item': item,
                'difficulty': item.get('difficulty', 0.0),
                'discrimination': item.get('discrimination', 1.0)
            }

            # Add predicted probability if learner specified
            if learner_id:
                item_data['predicted_p_correct'] = self.irt.predict_performance(
                    learner_id,
                    str(item['_id'])
                )

            results.append(item_data)

        return results

    def select_item_for_kc(self, learner_id: str, kc_id: str,
                          exploration: bool = True) -> Optional[Dict]:
        """
        Select optimal learning item for a KC using difficulty matching

        Args:
            learner_id: Learner ID
            kc_id: Knowledge component ID
            exploration: Whether to allow exploration (random selection)

        Returns:
            Selected item dict or None
        """
        # Get all items for this KC
        items = self.get_items_for_kc(kc_id, learner_id)

        if not items:
            return None

        # Get learner's interaction history for this KC
        past_interactions = set()
        interactions = self.collections.interactions.find({
            'learner_id': ObjectId(learner_id),
            'kc_id': ObjectId(kc_id)
        }).sort('created_at', -1).limit(10)  # Last 10 interactions

        for interaction in interactions:
            past_interactions.add(str(interaction['item_id']))

        # Filter out recently seen items (encourage variety)
        fresh_items = [item for item in items if item['item_id'] not in past_interactions]

        # If all items have been seen recently, use all items
        if not fresh_items:
            fresh_items = items

        # Exploration: occasionally pick random item
        if exploration and random.random() < self.EXPLORATION_RATE:
            return random.choice(fresh_items)

        # Exploitation: pick item closest to optimal difficulty
        target_p_correct = self.OPTIMAL_DIFFICULTY_RANGE

        best_item = None
        best_score = float('inf')

        for item in fresh_items:
            p_correct = item.get('predicted_p_correct', 0.5)

            # Score based on distance from optimal difficulty
            difficulty_score = abs(p_correct - target_p_correct)

            # Bonus for high discrimination (more informative items)
            discrimination = item['discrimination']
            discrimination_bonus = discrimination * 0.1

            final_score = difficulty_score - discrimination_bonus

            if final_score < best_score:
                best_score = final_score
                best_item = item

        return best_item

    def select_next_kc(self, learner_id: str) -> Optional[str]:
        """
        Select next KC for learning using prioritization

        Priority order:
        1. Due reviews (spaced repetition)
        2. In-progress KCs (continue current learning)
        3. New available KCs (start new topics)

        Args:
            learner_id: Learner ID

        Returns:
            Selected KC ID or None
        """
        # Check for due reviews first (highest priority)
        due_reviews = self.fsrs.get_due_reviews(learner_id)

        if due_reviews:
            # Return highest priority review
            return due_reviews[0]['kc_id']

        # Get all available KCs
        available = self.get_available_kcs(learner_id)

        if not available:
            return None

        # Prioritize in-progress KCs
        in_progress = [kc for kc in available if kc['skill_state'].get('status') == 'in_progress']

        if in_progress:
            # Sort by lowest mastery (focus on weakest skills)
            in_progress.sort(key=lambda x: x['skill_state'].get('p_mastery', 0.0))
            return in_progress[0]['kc_id']

        # Start new KC (available but not started)
        new_kcs = [kc for kc in available if kc['skill_state'].get('status') == 'available']

        if new_kcs:
            # Check prerequisites
            for kc_data in new_kcs:
                kc_id = kc_data['kc_id']

                # Check if prerequisites are met
                prereqs = self.collections.kc_prerequisites.find({
                    'kc_id': ObjectId(kc_id),
                    'is_required': True
                })

                prerequisites_met = True
                for prereq in prereqs:
                    prereq_state = self.collections.learner_skill_states.find_one({
                        'learner_id': ObjectId(learner_id),
                        'kc_id': prereq['prerequisite_kc_id']
                    })

                    if not prereq_state or prereq_state.get('status') != 'mastered':
                        prerequisites_met = False
                        break

                if prerequisites_met:
                    return kc_id

        return None

    def select_next_item(self, learner_id: str, kc_id: Optional[str] = None) -> Optional[Dict]:
        """
        Select next optimal learning item for a learner

        Args:
            learner_id: Learner ID
            kc_id: Specific KC (auto-selects if None)

        Returns:
            Dict with selected item, KC, and metadata
        """
        # Select KC if not specified
        if kc_id is None:
            kc_id = self.select_next_kc(learner_id)

        if not kc_id:
            return None

        # Check if this is a review
        is_review = self.should_review(learner_id, kc_id)

        # Select item for the KC
        selected_item = self.select_item_for_kc(learner_id, kc_id)

        if not selected_item:
            return None

        # Get KC details
        kc = self.collections.knowledge_components.find_one({
            '_id': ObjectId(kc_id)
        })

        # Get mastery status
        mastery_status = self.bkt.get_mastery_status(learner_id, kc_id)

        return {
            'item_id': selected_item['item_id'],
            'item': selected_item['item'],
            'kc_id': kc_id,
            'kc': kc,
            'predicted_p_correct': selected_item.get('predicted_p_correct', 0.5),
            'is_review': is_review,
            'p_mastery': mastery_status['p_mastery'],
            'selection_method': 'adaptive',
            'difficulty': selected_item['difficulty'],
            'discrimination': selected_item['discrimination']
        }

    def get_learning_session(self, learner_id: str, target_items: int = 5) -> List[Dict]:
        """
        Generate a complete learning session with multiple items

        Args:
            learner_id: Learner ID
            target_items: Number of items to include

        Returns:
            List of selected items for the session
        """
        session_items = []
        attempted_kcs = set()

        for _ in range(target_items):
            # Try to get item from different KC each time
            selected = None
            attempts = 0
            max_attempts = 10

            while attempts < max_attempts:
                kc_id = self.select_next_kc(learner_id)

                if not kc_id or kc_id in attempted_kcs:
                    attempts += 1
                    continue

                selected = self.select_item_for_kc(learner_id, kc_id)

                if selected:
                    attempted_kcs.add(kc_id)
                    break

                attempts += 1

            if selected:
                # Get KC details
                kc = self.collections.knowledge_components.find_one({
                    '_id': ObjectId(kc_id)
                })

                session_items.append({
                    'item_id': selected['item_id'],
                    'item': selected['item'],
                    'kc_id': kc_id,
                    'kc': kc,
                    'predicted_p_correct': selected.get('predicted_p_correct', 0.5),
                    'position': len(session_items)
                })

        return session_items

    def record_interaction_and_update(self, learner_id: str, item_id: str,
                                     kc_id: str, is_correct: bool,
                                     response_value: Dict, response_time_ms: int,
                                     hint_used: bool = False,
                                     session_id: Optional[str] = None) -> Dict:
        """
        Record interaction and update all models (BKT, FSRS, IRT)

        Args:
            learner_id: Learner ID
            item_id: Learning item ID
            kc_id: Knowledge component ID
            is_correct: Whether response was correct
            response_value: Learner's response data
            response_time_ms: Response time in milliseconds
            hint_used: Whether hint was used
            session_id: Session ID (generates if None)

        Returns:
            Dict with updated states and predictions
        """
        # Get current mastery before update
        p_mastery_before = self.bkt.get_mastery_status(learner_id, kc_id)['p_mastery']

        # Get current retrievability
        skill_state = self.collections.learner_skill_states.find_one({
            'learner_id': ObjectId(learner_id),
            'kc_id': ObjectId(kc_id)
        })

        retrievability_before = 1.0
        if skill_state and skill_state.get('fsrs_data'):
            last_review = skill_state.get('last_reviewed_at')
            if last_review:
                days_since = (datetime.utcnow() - last_review).total_seconds() / 86400
                stability = skill_state['fsrs_data'].get('stability', 1.0)
                retrievability_before = self.fsrs.calculate_retrievability(days_since, stability)

        # Predict p_correct before update
        predicted_p_correct = self.irt.predict_performance(learner_id, item_id)

        # Create interaction record
        interaction_id = self.collections.create_interaction(
            learner_id=learner_id,
            item_id=item_id,
            kc_id=kc_id,
            session_id=session_id,
            is_correct=is_correct,
            response_value=response_value,
            response_time_ms=response_time_ms,
            hint_used=hint_used,
            p_mastery_before=p_mastery_before,
            retrievability_before=retrievability_before,
            selection_method='adaptive',
            predicted_p_correct=predicted_p_correct
        )

        # Update BKT mastery
        new_p_mastery = self.bkt.update_mastery(learner_id, kc_id, is_correct)

        # Update FSRS schedule (rating based on correctness and time)
        rating = self._calculate_rating(is_correct, response_time_ms, hint_used)
        fsrs_update = self.fsrs.schedule_review(learner_id, kc_id, rating)

        # Update skill state statistics
        self.collections.learner_skill_states.update_one(
            {
                'learner_id': ObjectId(learner_id),
                'kc_id': ObjectId(kc_id)
            },
            {
                '$inc': {
                    'total_attempts': 1,
                    'correct_count': 1 if is_correct else 0
                }
            }
        )

        # Update item statistics
        self.collections.update_item_statistics(item_id, is_correct, response_time_ms)

        return {
            'interaction_id': interaction_id,
            'p_mastery_before': p_mastery_before,
            'p_mastery_after': new_p_mastery,
            'mastery_change': new_p_mastery - p_mastery_before,
            'next_review_date': fsrs_update['next_review_date'],
            'fsrs_stability': fsrs_update['stability'],
            'fsrs_difficulty': fsrs_update['difficulty'],
            'is_correct': is_correct
        }

    def _calculate_rating(self, is_correct: bool, response_time_ms: int,
                         hint_used: bool) -> int:
        """
        Calculate FSRS rating (1-4) based on performance

        Args:
            is_correct: Whether response was correct
            response_time_ms: Response time in milliseconds
            hint_used: Whether hint was used

        Returns:
            Rating from 1 (again) to 4 (easy)
        """
        if not is_correct:
            return 1  # Again

        if hint_used:
            return 2  # Hard

        # Base on response time (quick = easy, slow = hard)
        # Assume average time is 15 seconds = 15000ms
        if response_time_ms < 10000:
            return 4  # Easy (quick and correct)
        elif response_time_ms < 20000:
            return 3  # Good (normal time)
        else:
            return 2  # Hard (slow but correct)
