"""
Item Response Theory (IRT) Calibration Service

This module implements IRT for calibrating item difficulty and discrimination.
Uses a 2-Parameter Logistic (2PL) model to estimate item characteristics
based on learner performance data.
"""

from typing import List, Dict, Tuple, Optional
from bson import ObjectId
import math
from collections import defaultdict


class IRTCalibrator:
    """
    Implements 2PL IRT model for item calibration

    The 2PL model estimates:
    - difficulty (b): How hard an item is
    - discrimination (a): How well an item differentiates ability levels

    P(correct) = 1 / (1 + exp(-a * (theta - b)))
    """

    # Calibration constants
    MAX_ITERATIONS = 100
    CONVERGENCE_THRESHOLD = 0.001
    LEARNING_RATE = 0.1
    MIN_RESPONSES = 10  # Minimum responses needed for calibration

    def __init__(self, db_collections):
        """
        Initialize IRT calibrator

        Args:
            db_collections: FinLitCollections instance
        """
        self.collections = db_collections

    def logistic(self, theta: float, difficulty: float, discrimination: float) -> float:
        """
        2PL IRT probability function

        P(correct|theta, a, b) = 1 / (1 + exp(-a * (theta - b)))

        Args:
            theta: Learner ability parameter
            difficulty: Item difficulty parameter (b)
            discrimination: Item discrimination parameter (a)

        Returns:
            Probability of correct response [0, 1]
        """
        exponent = -discrimination * (theta - difficulty)
        # Clip to prevent overflow
        exponent = max(-20, min(20, exponent))
        return 1.0 / (1.0 + math.exp(exponent))

    def estimate_ability(self, learner_id: str, kc_id: Optional[str] = None) -> float:
        """
        Estimate learner ability (theta) based on performance

        Uses average p_mastery across KCs as ability estimate

        Args:
            learner_id: Learner ID
            kc_id: Specific KC ID (uses all KCs if None)

        Returns:
            Estimated ability parameter theta
        """
        query = {'learner_id': ObjectId(learner_id)}
        if kc_id:
            query['kc_id'] = ObjectId(kc_id)

        skill_states = self.collections.learner_skill_states.find(query)

        mastery_values = []
        for state in skill_states:
            p_mastery = state.get('p_mastery', 0.1)
            mastery_values.append(p_mastery)

        if not mastery_values:
            return 0.0  # Average ability

        # Convert average mastery to theta scale
        avg_mastery = sum(mastery_values) / len(mastery_values)

        # Map [0, 1] mastery to [-3, 3] theta scale
        # Using inverse logistic transformation
        avg_mastery = max(0.01, min(0.99, avg_mastery))
        theta = math.log(avg_mastery / (1 - avg_mastery))

        return theta

    def get_item_responses(self, item_id: str) -> List[Dict]:
        """
        Get all learner responses for an item with ability estimates

        Args:
            item_id: Learning item ID

        Returns:
            List of dicts with learner_id, is_correct, and estimated ability
        """
        interactions = self.collections.interactions.find({
            'item_id': ObjectId(item_id)
        })

        responses = []
        learner_abilities = {}  # Cache abilities

        for interaction in interactions:
            learner_id = str(interaction['learner_id'])

            # Get or compute learner ability
            if learner_id not in learner_abilities:
                learner_abilities[learner_id] = self.estimate_ability(learner_id)

            responses.append({
                'learner_id': learner_id,
                'is_correct': interaction.get('is_correct', False),
                'theta': learner_abilities[learner_id]
            })

        return responses

    def calibrate_item(self, item_id: str, initial_difficulty: float = 0.0,
                      initial_discrimination: float = 1.0) -> Tuple[float, float]:
        """
        Calibrate item difficulty and discrimination using Newton-Raphson

        Args:
            item_id: Learning item ID
            initial_difficulty: Starting difficulty estimate
            initial_discrimination: Starting discrimination estimate

        Returns:
            Tuple of (difficulty, discrimination)
        """
        responses = self.get_item_responses(item_id)

        if len(responses) < self.MIN_RESPONSES:
            # Not enough data, return initial estimates
            return initial_difficulty, initial_discrimination

        # Initialize parameters
        difficulty = initial_difficulty
        discrimination = initial_discrimination

        # Iterative optimization using gradient descent
        for iteration in range(self.MAX_ITERATIONS):
            # Compute gradients
            grad_b = 0.0  # Gradient for difficulty
            grad_a = 0.0  # Gradient for discrimination

            for response in responses:
                theta = response['theta']
                y = 1.0 if response['is_correct'] else 0.0

                # Predicted probability
                p = self.logistic(theta, difficulty, discrimination)

                # Gradients (derivatives of log-likelihood)
                error = y - p

                grad_b += discrimination * error
                grad_a += (theta - difficulty) * error

            # Update parameters
            old_difficulty = difficulty
            old_discrimination = discrimination

            difficulty += self.LEARNING_RATE * grad_b / len(responses)
            discrimination += self.LEARNING_RATE * grad_a / len(responses)

            # Ensure discrimination stays positive
            discrimination = max(0.1, discrimination)

            # Check convergence
            b_change = abs(difficulty - old_difficulty)
            a_change = abs(discrimination - old_discrimination)

            if b_change < self.CONVERGENCE_THRESHOLD and a_change < self.CONVERGENCE_THRESHOLD:
                break

        return difficulty, discrimination

    def update_item_parameters(self, item_id: str) -> Dict:
        """
        Calibrate and update item parameters in database

        Args:
            item_id: Learning item ID

        Returns:
            Dict with updated difficulty, discrimination, and metadata
        """
        # Get current item
        item = self.collections.learning_items.find_one({'_id': ObjectId(item_id)})

        if not item:
            raise ValueError(f"Item {item_id} not found")

        # Get current parameters
        current_difficulty = item.get('difficulty', 0.0)
        current_discrimination = item.get('discrimination', 1.0)

        # Calibrate
        new_difficulty, new_discrimination = self.calibrate_item(
            item_id,
            current_difficulty,
            current_discrimination
        )

        # Count responses
        response_count = self.collections.interactions.count_documents({
            'item_id': ObjectId(item_id)
        })

        # Update in database
        self.collections.learning_items.update_one(
            {'_id': ObjectId(item_id)},
            {
                '$set': {
                    'difficulty': new_difficulty,
                    'discrimination': new_discrimination,
                    'calibration_sample_size': response_count
                }
            }
        )

        return {
            'item_id': item_id,
            'difficulty': new_difficulty,
            'discrimination': new_discrimination,
            'sample_size': response_count,
            'difficulty_change': abs(new_difficulty - current_difficulty),
            'discrimination_change': abs(new_discrimination - current_discrimination)
        }

    def calibrate_all_items(self, min_responses: Optional[int] = None) -> List[Dict]:
        """
        Calibrate all items with sufficient response data

        Args:
            min_responses: Minimum responses required (uses default if None)

        Returns:
            List of calibration results for all updated items
        """
        if min_responses is None:
            min_responses = self.MIN_RESPONSES

        # Get items with enough responses
        pipeline = [
            {
                '$lookup': {
                    'from': 'interactions',
                    'localField': '_id',
                    'foreignField': 'item_id',
                    'as': 'interactions'
                }
            },
            {
                '$match': {
                    'interactions': {'$exists': True},
                    '$expr': {'$gte': [{'$size': '$interactions'}, min_responses]}
                }
            },
            {
                '$project': {
                    '_id': 1,
                    'interaction_count': {'$size': '$interactions'}
                }
            }
        ]

        items_to_calibrate = list(self.collections.learning_items.aggregate(pipeline))

        results = []
        for item_data in items_to_calibrate:
            item_id = str(item_data['_id'])
            try:
                result = self.update_item_parameters(item_id)
                results.append(result)
            except Exception as e:
                results.append({
                    'item_id': item_id,
                    'error': str(e)
                })

        return results

    def predict_performance(self, learner_id: str, item_id: str) -> float:
        """
        Predict probability of correct response using IRT model

        Args:
            learner_id: Learner ID
            item_id: Learning item ID

        Returns:
            Predicted probability of correctness [0, 1]
        """
        # Get learner ability
        theta = self.estimate_ability(learner_id)

        # Get item parameters
        item = self.collections.learning_items.find_one({'_id': ObjectId(item_id)})

        if not item:
            return 0.5  # Default to 50% if item not found

        difficulty = item.get('difficulty', 0.0)
        discrimination = item.get('discrimination', 1.0)

        # Apply 2PL model
        probability = self.logistic(theta, difficulty, discrimination)

        return probability

    def get_item_analysis(self, item_id: str) -> Dict:
        """
        Get comprehensive item analysis including IRT parameters and statistics

        Args:
            item_id: Learning item ID

        Returns:
            Dict with item parameters, statistics, and performance metrics
        """
        item = self.collections.learning_items.find_one({'_id': ObjectId(item_id)})

        if not item:
            raise ValueError(f"Item {item_id} not found")

        # Get interaction statistics
        interactions = list(self.collections.interactions.find({'item_id': ObjectId(item_id)}))

        total_responses = len(interactions)
        if total_responses == 0:
            return {
                'item_id': item_id,
                'difficulty': item.get('difficulty', 0.0),
                'discrimination': item.get('discrimination', 1.0),
                'total_responses': 0,
                'p_value': 0.0,
                'needs_calibration': True
            }

        correct_count = sum(1 for i in interactions if i.get('is_correct', False))
        p_value = correct_count / total_responses

        # Get ability distribution of responders
        abilities = []
        for interaction in interactions:
            learner_id = str(interaction['learner_id'])
            theta = self.estimate_ability(learner_id)
            abilities.append(theta)

        avg_ability = sum(abilities) / len(abilities) if abilities else 0.0

        return {
            'item_id': item_id,
            'difficulty': item.get('difficulty', 0.0),
            'discrimination': item.get('discrimination', 1.0),
            'total_responses': total_responses,
            'correct_responses': correct_count,
            'p_value': p_value,
            'avg_responder_ability': avg_ability,
            'calibration_sample_size': item.get('calibration_sample_size', 0),
            'needs_calibration': total_responses >= self.MIN_RESPONSES and
                               total_responses > item.get('calibration_sample_size', 0)
        }

    def get_ability_distribution(self, kc_id: Optional[str] = None) -> Dict:
        """
        Get distribution of learner abilities

        Args:
            kc_id: Specific KC (uses all if None)

        Returns:
            Dict with ability statistics
        """
        query = {}
        if kc_id:
            query['kc_id'] = ObjectId(kc_id)

        skill_states = self.collections.learner_skill_states.find(query)

        abilities = []
        for state in skill_states:
            learner_id = str(state['learner_id'])
            theta = self.estimate_ability(learner_id, kc_id)
            abilities.append(theta)

        if not abilities:
            return {
                'count': 0,
                'mean': 0.0,
                'std': 0.0,
                'min': 0.0,
                'max': 0.0
            }

        mean_ability = sum(abilities) / len(abilities)
        variance = sum((x - mean_ability) ** 2 for x in abilities) / len(abilities)
        std_dev = math.sqrt(variance)

        return {
            'count': len(abilities),
            'mean': mean_ability,
            'std': std_dev,
            'min': min(abilities),
            'max': max(abilities)
        }
