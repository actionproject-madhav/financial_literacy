"""
Bayesian Knowledge Tracing (BKT) Service

This module implements BKT for tracking learner knowledge mastery.
BKT models knowledge as a hidden binary state (known/unknown) and updates
this probability based on learner performance.
"""

from typing import Optional, Dict
from bson import ObjectId
from datetime import datetime


class BKTParams:
    """BKT model parameters"""
    def __init__(self, p_init=0.1, p_learn=0.1, p_slip=0.1, p_guess=0.25):
        self.p_init = p_init      # Initial probability of knowing skill
        self.p_learn = p_learn    # Probability of learning from practice
        self.p_slip = p_slip      # Probability of slip (know but answer wrong)
        self.p_guess = p_guess    # Probability of guess (don't know but answer right)


class BayesianKnowledgeTracer:
    """
    Implements Bayesian Knowledge Tracing for skill mastery estimation

    BKT maintains a probability distribution over whether a learner has
    mastered a knowledge component, updating after each interaction.
    """

    MASTERY_THRESHOLD = 0.95

    def __init__(self, db_collections):
        """
        Initialize BKT service

        Args:
            db_collections: FinLitCollections instance for database access
        """
        self.collections = db_collections

    def get_skill_state(self, learner_id: str, kc_id: str) -> Optional[Dict]:
        """
        Get current skill state for a learner-KC pair

        Args:
            learner_id: Learner ID
            kc_id: Knowledge component ID

        Returns:
            Skill state document or None
        """
        return self.collections.learner_skill_states.find_one({
            'learner_id': ObjectId(learner_id),
            'kc_id': ObjectId(kc_id)
        })

    def initialize_skill_state(self, learner_id: str, kc_id: str,
                              params: Optional[BKTParams] = None) -> str:
        """
        Initialize BKT state for a new learner-KC pair

        Args:
            learner_id: Learner ID
            kc_id: Knowledge component ID
            params: BKT parameters (uses defaults if None)

        Returns:
            Created skill state ID
        """
        if params is None:
            params = BKTParams()

        # Check if already exists
        existing = self.get_skill_state(learner_id, kc_id)
        if existing:
            return str(existing['_id'])

        # Create new skill state
        return self.collections.create_learner_skill_state(
            learner_id=learner_id,
            kc_id=kc_id,
            status='available',
            p_mastery=params.p_init,
            bkt_params={
                'p_init': params.p_init,
                'p_learn': params.p_learn,
                'p_slip': params.p_slip,
                'p_guess': params.p_guess
            }
        )

    def update_mastery(self, learner_id: str, kc_id: str, is_correct: bool,
                      params: Optional[BKTParams] = None) -> float:
        """
        Update mastery probability based on learner performance

        Implements standard BKT update equations:
        - P(L_t|evidence) using Bayes rule
        - P(L_t+1) = P(L_t) + (1 - P(L_t)) * p_learn

        Args:
            learner_id: Learner ID
            kc_id: Knowledge component ID
            is_correct: Whether learner answered correctly
            params: BKT parameters (uses stored params if None)

        Returns:
            Updated mastery probability
        """
        # Get current skill state
        skill_state = self.get_skill_state(learner_id, kc_id)

        if not skill_state:
            # Initialize if doesn't exist
            self.initialize_skill_state(learner_id, kc_id, params)
            skill_state = self.get_skill_state(learner_id, kc_id)

        # Get BKT parameters
        if params is None:
            stored_params = skill_state.get('bkt_params', {})
            params = BKTParams(
                p_init=stored_params.get('p_init', 0.1),
                p_learn=stored_params.get('p_learn', 0.1),
                p_slip=stored_params.get('p_slip', 0.1),
                p_guess=stored_params.get('p_guess', 0.25)
            )

        # Current mastery probability
        p_mastery = skill_state.get('p_mastery', params.p_init)

        # Update based on correctness using Bayes' rule
        if is_correct:
            # P(L|correct) = P(correct|L) * P(L) / P(correct)
            # P(correct|L) = 1 - p_slip
            # P(correct|¬L) = p_guess
            p_correct_given_known = 1 - params.p_slip
            p_correct_given_unknown = params.p_guess

            p_correct = (p_mastery * p_correct_given_known +
                        (1 - p_mastery) * p_correct_given_unknown)

            if p_correct > 0:
                p_mastery_new = (p_mastery * p_correct_given_known) / p_correct
            else:
                p_mastery_new = p_mastery
        else:
            # P(L|incorrect) = P(incorrect|L) * P(L) / P(incorrect)
            # P(incorrect|L) = p_slip
            # P(incorrect|¬L) = 1 - p_guess
            p_incorrect_given_known = params.p_slip
            p_incorrect_given_unknown = 1 - params.p_guess

            p_incorrect = (p_mastery * p_incorrect_given_known +
                          (1 - p_mastery) * p_incorrect_given_unknown)

            if p_incorrect > 0:
                p_mastery_new = (p_mastery * p_incorrect_given_known) / p_incorrect
            else:
                p_mastery_new = p_mastery

        # Apply learning: P(L_t+1) = P(L_t) + (1 - P(L_t)) * p_learn
        p_mastery_after_learning = p_mastery_new + (1 - p_mastery_new) * params.p_learn

        # Ensure probability bounds [0, 1]
        p_mastery_after_learning = max(0.0, min(1.0, p_mastery_after_learning))

        # Determine new status
        new_status = skill_state.get('status', 'available')
        mastered_at = skill_state.get('mastered_at')

        if p_mastery_after_learning >= self.MASTERY_THRESHOLD and new_status != 'mastered':
            new_status = 'mastered'
            mastered_at = datetime.utcnow()
        elif p_mastery_after_learning < self.MASTERY_THRESHOLD and new_status == 'mastered':
            # Regression from mastery
            new_status = 'in_progress'
            mastered_at = None
        elif new_status == 'available' and p_mastery_after_learning > params.p_init:
            new_status = 'in_progress'

        # Update skill state in database
        update_data = {
            'p_mastery': p_mastery_after_learning,
            'status': new_status,
            'updated_at': datetime.utcnow()
        }

        if mastered_at:
            update_data['mastered_at'] = mastered_at
        elif 'mastered_at' in skill_state and new_status != 'mastered':
            # Remove mastered_at if regressed
            self.collections.learner_skill_states.update_one(
                {'_id': skill_state['_id']},
                {'$unset': {'mastered_at': ''}}
            )

        self.collections.learner_skill_states.update_one(
            {'_id': skill_state['_id']},
            {'$set': update_data}
        )

        return p_mastery_after_learning

    def predict_correctness(self, learner_id: str, kc_id: str,
                           params: Optional[BKTParams] = None) -> float:
        """
        Predict probability of correct response

        P(correct) = P(L) * (1 - p_slip) + (1 - P(L)) * p_guess

        Args:
            learner_id: Learner ID
            kc_id: Knowledge component ID
            params: BKT parameters (uses stored params if None)

        Returns:
            Predicted probability of correctness
        """
        skill_state = self.get_skill_state(learner_id, kc_id)

        if not skill_state:
            # No history, use initial probability
            if params is None:
                params = BKTParams()
            p_mastery = params.p_init
        else:
            p_mastery = skill_state.get('p_mastery', 0.1)

            if params is None:
                stored_params = skill_state.get('bkt_params', {})
                params = BKTParams(
                    p_init=stored_params.get('p_init', 0.1),
                    p_learn=stored_params.get('p_learn', 0.1),
                    p_slip=stored_params.get('p_slip', 0.1),
                    p_guess=stored_params.get('p_guess', 0.25)
                )

        # P(correct) = P(known) * P(correct|known) + P(unknown) * P(correct|unknown)
        p_correct = (p_mastery * (1 - params.p_slip) +
                    (1 - p_mastery) * params.p_guess)

        return p_correct

    def get_mastery_status(self, learner_id: str, kc_id: str) -> Dict:
        """
        Get comprehensive mastery status for a KC

        Args:
            learner_id: Learner ID
            kc_id: Knowledge component ID

        Returns:
            Dict with mastery probability, status, and metadata
        """
        skill_state = self.get_skill_state(learner_id, kc_id)

        if not skill_state:
            return {
                'p_mastery': 0.1,
                'status': 'locked',
                'is_mastered': False,
                'total_attempts': 0,
                'correct_count': 0
            }

        p_mastery = skill_state.get('p_mastery', 0.1)

        return {
            'p_mastery': p_mastery,
            'status': skill_state.get('status', 'locked'),
            'is_mastered': p_mastery >= self.MASTERY_THRESHOLD,
            'total_attempts': skill_state.get('total_attempts', 0),
            'correct_count': skill_state.get('correct_count', 0),
            'mastered_at': skill_state.get('mastered_at'),
            'updated_at': skill_state.get('updated_at')
        }
