"""
Semantic Matcher - Budget-Aware Version

Automatically uses local embeddings (free) or OpenAI embeddings based on config.
Falls back to LLM only for uncertain cases to minimize API costs.
"""

from typing import Dict, List, Optional
from config.services import config

# Import budget service (local embeddings)
try:
    from services import local_embeddings
    BUDGET_AVAILABLE = True
except ImportError:
    BUDGET_AVAILABLE = False

# Import premium service (OpenAI embeddings)
try:
    from services.semantic import SemanticMatcher as PremiumSemanticMatcher
    PREMIUM_AVAILABLE = True
except ImportError:
    PREMIUM_AVAILABLE = False

# Import OpenAI for LLM fallback
try:
    from openai import OpenAI
    openai_client = None

    def get_openai():
        global openai_client
        if openai_client is None and config.OPENAI_API_KEY:
            openai_client = OpenAI(api_key=config.OPENAI_API_KEY)
        return openai_client
except ImportError:
    def get_openai():
        return None


class BudgetSemanticMatcher:
    """Semantic matcher using local embeddings + minimal LLM usage"""

    # Thresholds for local embeddings (may need tuning)
    MATCH_THRESHOLD = 0.70  # Require 70% similarity to match
    LLM_FALLBACK_THRESHOLD = 0.60  # Use expensive LLM only if below this

    def __init__(self):
        if not BUDGET_AVAILABLE:
            raise RuntimeError("Budget embeddings not available. Install: sentence-transformers torch")

    def match_answer(
        self,
        spoken_text: str,
        choices: Dict[str, str],
        correct_answer: str,
        question_type: str = 'default'
    ) -> Dict:
        """
        Match spoken answer to choices using local embeddings.
        Falls back to LLM only for uncertain cases.

        Args:
            spoken_text: What the learner said
            choices: Dict of choice_id -> choice_text
            correct_answer: Correct choice ID
            question_type: Ignored in budget mode

        Returns:
            {
                'is_correct': bool,
                'matched_choice': str or None,
                'similarity_scores': dict,
                'best_match_score': float,
                'evaluation_reason': str,
                'used_llm_fallback': bool
            }
        """
        # Convert choices to format expected by local_embeddings
        choice_list = [{'id': k, 'text': v} for k, v in choices.items()]

        # Use local embeddings (free!)
        match_result = local_embeddings.match_text_to_choices(spoken_text, choice_list)

        similarity_scores = match_result['similarity_scores']
        best_choice = match_result['best_match']
        best_score = match_result['best_score']

        # Determine if we have a confident match
        matched_choice = best_choice if best_score >= self.MATCH_THRESHOLD else None
        is_correct = matched_choice == correct_answer
        evaluation_reason = None
        used_llm = False

        # Only use LLM for uncertain cases (saves money)
        if best_score < self.LLM_FALLBACK_THRESHOLD and get_openai():
            llm_result = self._llm_evaluate(spoken_text, choices, correct_answer)
            if llm_result:
                is_correct = llm_result['is_correct']
                evaluation_reason = llm_result['reason']
                used_llm = True
                if is_correct and not matched_choice:
                    matched_choice = correct_answer

        return {
            'is_correct': is_correct,
            'matched_choice': matched_choice,
            'similarity_scores': similarity_scores,
            'best_match_score': best_score,
            'evaluation_reason': evaluation_reason or f'Matched with {best_score:.2f} similarity',
            'used_llm_fallback': used_llm
        }

    def _llm_evaluate(self, spoken_text: str, choices: Dict, correct_answer: str) -> Optional[Dict]:
        """Use LLM for edge cases only (minimal API usage)"""
        client = get_openai()
        if not client:
            return None

        correct_text = choices.get(correct_answer, '')

        prompt = f"""Evaluate if this answer is semantically correct:

Spoken answer: "{spoken_text}"
Correct answer: "{correct_text}"

Consider correct if same meaning, even if worded differently.

Return ONLY JSON: {{"is_correct": true/false, "reason": "brief explanation"}}"""

        try:
            response = client.chat.completions.create(
                model='gpt-4o-mini',  # Cheapest model
                messages=[{'role': 'user', 'content': prompt}],
                temperature=0.1,
                max_tokens=100
            )

            import json
            text = response.choices[0].message.content.strip()

            # Handle markdown code blocks
            if text.startswith('```'):
                text = text.split('```')[1].replace('json', '').strip()

            return json.loads(text)

        except Exception as e:
            print(f"LLM evaluation error: {e}")
            return None

    def evaluate_free_response(
        self,
        spoken_text: str,
        correct_answer: str,
        explanation: str,
        question_text: str = ""
    ) -> Dict:
        """
        Evaluate free-form response.
        Uses LLM (requires API key) or falls back to embedding similarity.

        Args:
            spoken_text: Learner's answer
            correct_answer: Expected answer
            explanation: Explanation of correct answer
            question_text: Original question

        Returns:
            {
                'is_correct': bool,
                'partial_credit': float (0-1),
                'understanding_level': str,
                'feedback': str,
                'key_concepts_mentioned': list,
                'missing_concepts': list
            }
        """
        client = get_openai()

        if not client:
            # Fallback: use embedding similarity only
            sim = local_embeddings.calculate_similarity(
                local_embeddings.get_embedding(spoken_text),
                local_embeddings.get_embedding(correct_answer)
            )

            return {
                'is_correct': sim > 0.7,
                'partial_credit': round(sim, 2),
                'understanding_level': 'full' if sim > 0.8 else 'partial' if sim > 0.5 else 'none',
                'feedback': 'Good effort! Keep practicing.' if sim > 0.5 else 'Review the concept and try again.',
                'key_concepts_mentioned': [],
                'missing_concepts': []
            }

        # Use LLM for nuanced evaluation
        prompt = f"""Evaluate this learner's explanation:

Question: {question_text}
Student said: "{spoken_text}"
Correct explanation: "{correct_answer}"
Additional context: {explanation}

Evaluate understanding and provide feedback.

Return JSON:
{{
    "understanding_level": "none"|"partial"|"full",
    "partial_credit": 0.0-1.0,
    "key_concepts_mentioned": ["concept1", "concept2"],
    "missing_concepts": ["concept3"],
    "feedback": "encouraging specific feedback"
}}"""

        try:
            response = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[{'role': 'user', 'content': prompt}],
                temperature=0.3,
                max_tokens=250
            )

            import json
            text = response.choices[0].message.content.strip()

            if text.startswith('```'):
                text = text.split('```')[1].replace('json', '').strip()

            result = json.loads(text)
            result['is_correct'] = result['understanding_level'] == 'full'

            return result

        except Exception as e:
            print(f"Free response evaluation error: {e}")
            # Fallback to embedding similarity
            sim = local_embeddings.calculate_similarity(
                local_embeddings.get_embedding(spoken_text),
                local_embeddings.get_embedding(correct_answer)
            )

            return {
                'is_correct': sim > 0.7,
                'partial_credit': round(sim, 2),
                'understanding_level': 'partial',
                'feedback': 'Keep practicing!',
                'key_concepts_mentioned': [],
                'missing_concepts': []
            }


# Create unified SemanticMatcher that switches based on config
class SemanticMatcher:
    """
    Unified semantic matcher that automatically uses budget or premium services.

    Budget mode: Local embeddings (free) + minimal LLM usage
    Premium mode: OpenAI embeddings throughout
    """

    def __init__(self):
        if config.USE_BUDGET_SERVICES:
            if not BUDGET_AVAILABLE:
                raise RuntimeError("Budget services requested but not available. Install: sentence-transformers torch")
            self._matcher = BudgetSemanticMatcher()
            print("🔍 Using BUDGET semantic matching (Local embeddings)")
        else:
            if PREMIUM_AVAILABLE:
                self._matcher = PremiumSemanticMatcher()
                print("🔍 Using PREMIUM semantic matching (OpenAI embeddings)")
            else:
                # Fallback to budget
                self._matcher = BudgetSemanticMatcher()
                print("🔍 Premium not available, using BUDGET semantic matching")

    def match_answer(
        self,
        spoken_text: str,
        choices: Dict[str, str],
        correct_answer: str,
        question_type: str = 'default'
    ) -> Dict:
        """Match spoken answer to multiple choice options"""
        return self._matcher.match_answer(spoken_text, choices, correct_answer, question_type)

    def evaluate_free_response(
        self,
        spoken_text: str,
        correct_answer: str,
        explanation: str,
        question_text: str = ""
    ) -> Dict:
        """Evaluate free-form response"""
        return self._matcher.evaluate_free_response(
            spoken_text,
            correct_answer,
            explanation,
            question_text
        )
