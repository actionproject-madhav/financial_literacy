"""
Semantic Matching Service for Voice Answer Evaluation

This service uses OpenAI embeddings to semantically match spoken answers
to multiple choice options and evaluate free-form responses.
"""

import os
from typing import Dict, List, Optional
import numpy as np
from scipy.spatial.distance import cosine
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


class SemanticMatcher:
    """
    Semantic answer matching using embeddings and LLM evaluation

    Features:
    - Generate embeddings for text using OpenAI
    - Compare spoken answers to multiple choice options
    - Evaluate free-form responses with LLM
    - Dynamic thresholds based on question type
    """

    # Question type specific thresholds
    THRESHOLDS = {
        'definition': 0.80,  # "What is APR?" needs exact concept
        'calculation': 0.70,  # "What's 20% of $100?" allows method variance
        'scenario': 0.65,    # "Which should you pay first?" allows reasoning variance
        'true_false': 0.85,   # Binary questions need high confidence
        'default': 0.75      # General threshold
    }

    # Ambiguity detection threshold
    AMBIGUITY_THRESHOLD = 0.15  # If top 2 scores are within this range, it's ambiguous

    def __init__(self):
        """Initialize OpenAI client"""
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.embedding_model = "text-embedding-3-small"
        self.chat_model = "gpt-4o-mini"

        # Cache for embeddings (item_id -> embedding)
        self._embedding_cache = {}

    async def get_embedding(self, text: str) -> List[float]:
        """
        Get embedding vector for text

        Args:
            text: Input text to embed

        Returns:
            List of floats representing the embedding vector
        """
        try:
            response = self.client.embeddings.create(
                input=text,
                model=self.embedding_model
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error generating embedding: {e}")
            # Return zero vector as fallback
            return [0.0] * 1536  # text-embedding-3-small dimension

    def get_embedding_sync(self, text: str) -> List[float]:
        """Synchronous version of get_embedding"""
        try:
            response = self.client.embeddings.create(
                input=text,
                model=self.embedding_model
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return [0.0] * 1536

    def _calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings

        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector

        Returns:
            Similarity score (0-1)
        """
        try:
            # Cosine similarity = 1 - cosine distance
            similarity = 1 - cosine(embedding1, embedding2)
            return max(0.0, min(1.0, similarity))  # Clamp to [0, 1]
        except Exception as e:
            print(f"Error calculating similarity: {e}")
            return 0.0

    def match_answer(
        self,
        spoken_text: str,
        choices: Dict[str, str],
        correct_answer: str,
        question_type: str = 'default'
    ) -> Dict:
        """
        Match spoken answer to multiple choice options

        Args:
            spoken_text: Transcribed voice answer
            choices: Dict of choice_id -> choice_text (e.g., {'a': 'Option A', 'b': 'Option B'})
            correct_answer: The correct choice ID (e.g., 'a')
            question_type: Type of question for threshold selection

        Returns:
            {
                'is_correct': bool or None (None if ambiguous),
                'matched_choice': str or None,
                'similarity_scores': dict,
                'best_match_score': float,
                'evaluation_reason': str,
                'clarification_needed': bool,
                'clarification_prompt': str or None,
                'similar_choices': list or None
            }
        """
        # Get embeddings for spoken text
        spoken_embedding = self.get_embedding_sync(spoken_text)

        # Get embeddings for all choices
        similarity_scores = {}
        choice_embeddings = {}

        for choice_id, choice_text in choices.items():
            choice_embedding = self.get_embedding_sync(choice_text)
            choice_embeddings[choice_id] = choice_embedding
            similarity = self._calculate_similarity(spoken_embedding, choice_embedding)
            similarity_scores[choice_id] = round(similarity, 3)

        # Find best match
        if not similarity_scores:
            return {
                'is_correct': False,
                'matched_choice': None,
                'similarity_scores': {},
                'best_match_score': 0.0,
                'evaluation_reason': 'No choices provided',
                'clarification_needed': False,
                'clarification_prompt': None,
                'similar_choices': None
            }

        # Sort by similarity
        sorted_choices = sorted(similarity_scores.items(), key=lambda x: x[1], reverse=True)
        best_choice, best_score = sorted_choices[0]
        second_choice, second_score = sorted_choices[1] if len(sorted_choices) > 1 else (None, 0.0)

        # Check for ambiguity
        if second_choice and (best_score - second_score) < self.AMBIGUITY_THRESHOLD:
            return {
                'is_correct': None,
                'matched_choice': None,
                'similarity_scores': similarity_scores,
                'best_match_score': best_score,
                'evaluation_reason': f'Answer is ambiguous between {best_choice} and {second_choice}',
                'clarification_needed': True,
                'clarification_prompt': f"Did you mean '{choices[best_choice]}' or '{choices[second_choice]}'?",
                'similar_choices': [best_choice, second_choice]
            }

        # Get threshold for question type
        threshold = self.THRESHOLDS.get(question_type, self.THRESHOLDS['default'])

        # Determine if match is confident enough
        if best_score < threshold:
            return {
                'is_correct': False,
                'matched_choice': None,
                'similarity_scores': similarity_scores,
                'best_match_score': best_score,
                'evaluation_reason': f'No confident match found (best: {best_score:.2f}, threshold: {threshold:.2f})',
                'clarification_needed': False,
                'clarification_prompt': None,
                'similar_choices': None
            }

        # We have a confident match
        is_correct = (best_choice == correct_answer)

        return {
            'is_correct': is_correct,
            'matched_choice': best_choice,
            'similarity_scores': similarity_scores,
            'best_match_score': best_score,
            'evaluation_reason': f'Matched to choice {best_choice} with {best_score:.2f} similarity',
            'clarification_needed': False,
            'clarification_prompt': None,
            'similar_choices': None
        }

    def evaluate_free_response(
        self,
        spoken_text: str,
        correct_answer: str,
        explanation: str,
        question_text: str = ""
    ) -> Dict:
        """
        Evaluate free-form spoken answer using LLM

        Args:
            spoken_text: Transcribed voice answer
            correct_answer: The correct answer text
            explanation: Explanation of the correct answer
            question_text: The original question (for context)

        Returns:
            {
                'is_correct': bool,
                'partial_credit': float (0-1),
                'understanding_level': str ('none', 'partial', 'full'),
                'feedback': str,
                'key_concepts_mentioned': list,
                'missing_concepts': list
            }
        """
        try:
            prompt = f"""You are evaluating a student's spoken answer to a financial literacy question.

Question: {question_text}

Correct Answer: {correct_answer}

Explanation: {explanation}

Student's Spoken Answer: "{spoken_text}"

Evaluate the student's understanding. Consider:
1. Did they demonstrate understanding of key concepts?
2. Is their reasoning correct, even if wording differs?
3. What percentage of the concept do they understand?

Respond in JSON format:
{{
    "is_correct": true/false,
    "partial_credit": 0.0 to 1.0,
    "understanding_level": "none" | "partial" | "full",
    "feedback": "constructive feedback for the student",
    "key_concepts_mentioned": ["concept1", "concept2"],
    "missing_concepts": ["concept3"]
}}"""

            response = self.client.chat.completions.create(
                model=self.chat_model,
                messages=[
                    {"role": "system", "content": "You are a financial literacy tutor evaluating student answers."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            import json
            result = json.loads(response.choices[0].message.content)
            return result

        except Exception as e:
            print(f"Error evaluating free response: {e}")
            # Fallback to simple embedding comparison
            correct_embedding = self.get_embedding_sync(correct_answer)
            spoken_embedding = self.get_embedding_sync(spoken_text)
            similarity = self._calculate_similarity(correct_embedding, spoken_embedding)

            return {
                'is_correct': similarity > 0.7,
                'partial_credit': similarity,
                'understanding_level': 'full' if similarity > 0.8 else 'partial' if similarity > 0.5 else 'none',
                'feedback': f'Your answer has {similarity*100:.0f}% similarity to the correct answer.',
                'key_concepts_mentioned': [],
                'missing_concepts': []
            }

    def batch_embed_choices(self, items: List[Dict]) -> Dict[str, List[float]]:
        """
        Pre-generate embeddings for multiple choice items (for caching)

        Args:
            items: List of items with choice data

        Returns:
            Dict mapping item_id:choice_id to embedding
        """
        embeddings = {}

        for item in items:
            item_id = str(item.get('_id'))
            choices = item.get('content', {}).get('choices', {})

            for choice_id, choice_text in choices.items():
                cache_key = f"{item_id}:{choice_id}"
                if cache_key not in self._embedding_cache:
                    embedding = self.get_embedding_sync(choice_text)
                    self._embedding_cache[cache_key] = embedding
                    embeddings[cache_key] = embedding

        return embeddings
