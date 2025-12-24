"""
FSRS (Free Spaced Repetition Scheduler) Service

This module implements the FSRS algorithm for optimal review scheduling.
FSRS uses a sophisticated memory model to predict when learners should
review content for optimal long-term retention.
"""

from typing import Optional, List, Dict
from datetime import datetime, timedelta
from bson import ObjectId
import math


class FSRSScheduler:
    """
    Implements FSRS algorithm for spaced repetition scheduling

    FSRS models memory decay and schedules reviews to maintain
    high retention probability while minimizing review frequency.
    """

    # FSRS default parameters (optimized for general learning)
    DEFAULT_PARAMS = {
        'w': [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61]
    }

    # Retention target (85% retention rate)
    TARGET_RETENTION = 0.85

    # Rating to ease factor mapping
    RATING_EASE = {
        1: 'again',      # Complete failure
        2: 'hard',       # Difficult recall
        3: 'good',       # Correct with effort
        4: 'easy'        # Perfect recall
    }

    def __init__(self, db_collections, params: Optional[Dict] = None):
        """
        Initialize FSRS scheduler

        Args:
            db_collections: FinLitCollections instance
            params: FSRS model parameters (uses defaults if None)
        """
        self.collections = db_collections
        self.params = params or self.DEFAULT_PARAMS

    def calculate_retrievability(self, days_since_review: float, stability: float) -> float:
        """
        Calculate current retrievability (probability of recall)

        R = exp(ln(0.9) * days / stability)

        Args:
            days_since_review: Days since last review
            stability: Memory stability (in days)

        Returns:
            Retrievability probability [0, 1]
        """
        if stability <= 0:
            return 0.9  # New items

        decay_factor = math.log(0.9)
        retrievability = math.exp(decay_factor * days_since_review / stability)
        return max(0.0, min(1.0, retrievability))

    def calculate_next_stability(self, current_stability: float, rating: int,
                                 retrievability: float) -> float:
        """
        Calculate new stability after review

        Uses FSRS formula incorporating current stability, rating, and retrievability

        Args:
            current_stability: Current memory stability
            rating: Review rating (1-4)
            retrievability: Current retrievability

        Returns:
            New stability value
        """
        w = self.params['w']

        if rating == 1:  # Again
            # Stability decreases on failure
            new_stability = w[11] * current_stability * math.pow(retrievability, w[12])
        elif rating == 2:  # Hard
            new_stability = current_stability * (1 + math.exp(w[13]) * (11 - retrievability) * w[14])
        elif rating == 3:  # Good
            new_stability = current_stability * (1 + math.exp(w[8]) * (11 - retrievability) * w[9])
        else:  # Easy (rating == 4)
            new_stability = current_stability * (1 + math.exp(w[15]) * (11 - retrievability) * w[16])

        return max(0.1, new_stability)

    def calculate_initial_stability(self, rating: int) -> float:
        """
        Calculate initial stability for first review

        Args:
            rating: Initial review rating (1-4)

        Returns:
            Initial stability value
        """
        w = self.params['w']

        if rating == 1:
            return w[0]
        elif rating == 2:
            return w[1]
        elif rating == 3:
            return w[2]
        else:  # rating == 4
            return w[3]

    def calculate_difficulty(self, current_difficulty: Optional[float], rating: int) -> float:
        """
        Calculate updated difficulty based on performance

        Args:
            current_difficulty: Current difficulty (None for new items)
            rating: Review rating (1-4)

        Returns:
            Updated difficulty [1, 10]
        """
        w = self.params['w']

        if current_difficulty is None:
            # Initial difficulty
            initial_d = w[4] - math.exp(w[5]) * (rating - 1)
            return max(1.0, min(10.0, initial_d))

        # Update difficulty based on rating
        difficulty_delta = -w[6] * (rating - 3)
        new_difficulty = current_difficulty + difficulty_delta

        # Mean reversion towards 5
        new_difficulty = w[7] * current_difficulty + (1 - w[7]) * new_difficulty

        return max(1.0, min(10.0, new_difficulty))

    def calculate_interval(self, stability: float, target_retention: Optional[float] = None) -> int:
        """
        Calculate optimal review interval

        I = S * (ln(target_retention) / ln(0.9))

        Args:
            stability: Current memory stability
            target_retention: Target retention probability (uses default if None)

        Returns:
            Review interval in days
        """
        if target_retention is None:
            target_retention = self.TARGET_RETENTION

        if target_retention <= 0 or target_retention >= 1:
            target_retention = self.TARGET_RETENTION

        interval = stability * (math.log(target_retention) / math.log(0.9))
        return max(1, int(round(interval)))

    def schedule_review(self, learner_id: str, kc_id: str, rating: int,
                       reviewed_at: Optional[datetime] = None) -> Dict:
        """
        Schedule next review based on performance rating

        Args:
            learner_id: Learner ID
            kc_id: Knowledge component ID
            rating: Performance rating (1-4)
            reviewed_at: Review timestamp (uses current time if None)

        Returns:
            Dict with next_review_date, stability, difficulty, retrievability
        """
        if reviewed_at is None:
            reviewed_at = datetime.utcnow()

        # Get current skill state
        skill_state = self.collections.learner_skill_states.find_one({
            'learner_id': ObjectId(learner_id),
            'kc_id': ObjectId(kc_id)
        })

        if not skill_state:
            # Initialize new skill state
            stability = self.calculate_initial_stability(rating)
            difficulty = self.calculate_difficulty(None, rating)
            retrievability = 1.0
            last_review = reviewed_at
        else:
            # Get current FSRS data
            fsrs_data = skill_state.get('fsrs_data', {})
            current_stability = fsrs_data.get('stability', 0.1)
            current_difficulty = fsrs_data.get('difficulty', 5.0)
            last_review = skill_state.get('last_reviewed_at', reviewed_at)

            # Calculate days since last review
            days_since = (reviewed_at - last_review).total_seconds() / 86400
            days_since = max(0, days_since)

            # Calculate current retrievability
            retrievability = self.calculate_retrievability(days_since, current_stability)

            # Update stability and difficulty
            stability = self.calculate_next_stability(current_stability, rating, retrievability)
            difficulty = self.calculate_difficulty(current_difficulty, rating)

        # Calculate next review interval
        interval_days = self.calculate_interval(stability)
        next_review_date = reviewed_at + timedelta(days=interval_days)

        # Update skill state
        update_data = {
            'last_reviewed_at': reviewed_at,
            'next_review_at': next_review_date,
            'fsrs_data': {
                'stability': stability,
                'difficulty': difficulty,
                'retrievability': retrievability,
                'last_rating': rating,
                'review_count': fsrs_data.get('review_count', 0) + 1 if skill_state else 1
            },
            'updated_at': datetime.utcnow()
        }

        if skill_state:
            self.collections.learner_skill_states.update_one(
                {'_id': skill_state['_id']},
                {'$set': update_data}
            )
        else:
            # Create new skill state
            self.collections.create_learner_skill_state(
                learner_id=learner_id,
                kc_id=kc_id,
                status='in_progress',
                **update_data
            )

        return {
            'next_review_date': next_review_date,
            'interval_days': interval_days,
            'stability': stability,
            'difficulty': difficulty,
            'retrievability': retrievability
        }

    def get_due_reviews(self, learner_id: str, as_of: Optional[datetime] = None) -> List[Dict]:
        """
        Get all KCs due for review

        Args:
            learner_id: Learner ID
            as_of: Check reviews due as of this time (uses current time if None)

        Returns:
            List of skill states due for review, sorted by priority
        """
        if as_of is None:
            as_of = datetime.utcnow()

        # Find all skill states with reviews due
        due_states = self.collections.learner_skill_states.find({
            'learner_id': ObjectId(learner_id),
            'next_review_at': {'$lte': as_of},
            'status': {'$in': ['in_progress', 'mastered']}
        })

        results = []
        for state in due_states:
            last_review = state.get('last_reviewed_at', as_of)
            days_overdue = (as_of - state.get('next_review_at', as_of)).total_seconds() / 86400

            fsrs_data = state.get('fsrs_data', {})
            stability = fsrs_data.get('stability', 1.0)

            # Calculate current retrievability
            days_since = (as_of - last_review).total_seconds() / 86400
            retrievability = self.calculate_retrievability(days_since, stability)

            results.append({
                'kc_id': str(state['kc_id']),
                'skill_state_id': str(state['_id']),
                'next_review_at': state.get('next_review_at'),
                'days_overdue': max(0, days_overdue),
                'retrievability': retrievability,
                'difficulty': fsrs_data.get('difficulty', 5.0),
                'priority': days_overdue * (1 - retrievability)  # Prioritize by urgency and forgetting
            })

        # Sort by priority (highest first)
        results.sort(key=lambda x: x['priority'], reverse=True)

        return results

    def get_upcoming_reviews(self, learner_id: str, days_ahead: int = 7) -> List[Dict]:
        """
        Get reviews scheduled in the next N days

        Args:
            learner_id: Learner ID
            days_ahead: Number of days to look ahead

        Returns:
            List of upcoming reviews with dates and metadata
        """
        now = datetime.utcnow()
        future = now + timedelta(days=days_ahead)

        upcoming = self.collections.learner_skill_states.find({
            'learner_id': ObjectId(learner_id),
            'next_review_at': {
                '$gt': now,
                '$lte': future
            },
            'status': {'$in': ['in_progress', 'mastered']}
        }).sort('next_review_at', 1)

        results = []
        for state in upcoming:
            fsrs_data = state.get('fsrs_data', {})

            results.append({
                'kc_id': str(state['kc_id']),
                'next_review_at': state.get('next_review_at'),
                'days_until': (state.get('next_review_at') - now).days,
                'stability': fsrs_data.get('stability', 1.0),
                'difficulty': fsrs_data.get('difficulty', 5.0),
                'review_count': fsrs_data.get('review_count', 0)
            })

        return results

    def get_retention_rate(self, learner_id: str, kc_id: str) -> float:
        """
        Get current estimated retention rate for a KC

        Args:
            learner_id: Learner ID
            kc_id: Knowledge component ID

        Returns:
            Estimated retention probability [0, 1]
        """
        skill_state = self.collections.learner_skill_states.find_one({
            'learner_id': ObjectId(learner_id),
            'kc_id': ObjectId(kc_id)
        })

        if not skill_state:
            return 0.0

        last_review = skill_state.get('last_reviewed_at')
        if not last_review:
            return 0.0

        fsrs_data = skill_state.get('fsrs_data', {})
        stability = fsrs_data.get('stability', 1.0)

        days_since = (datetime.utcnow() - last_review).total_seconds() / 86400
        return self.calculate_retrievability(days_since, stability)
