"""
Personalization Service - LLM-powered content personalization

This service personalizes learning content for individual learners based on:
- Country of origin
- Visa type
- English proficiency
- Learning history

Uses LLM to generate culturally relevant explanations and context.
"""

from typing import Dict, Optional
from bson import ObjectId
from .llm_service import get_llm_service


class PersonalizationService:
    """
    Service for personalizing learning content using LLM
    """

    def __init__(self, db_collections):
        """
        Initialize personalization service

        Args:
            db_collections: FinLitCollections instance
        """
        self.collections = db_collections
        self.llm = get_llm_service()

    def get_cultural_bridge(self, kc_id: str, country_code: str) -> Optional[str]:
        """
        Get cultural context that bridges US concepts to learner's home country

        Args:
            kc_id: Knowledge component ID
            country_code: ISO country code (e.g., "IND", "MEX", "CHN")

        Returns:
            Cultural context text or None
        """
        # Try cached context first
        cached = self.collections.cultural_contexts.find_one({
            'kc_id': ObjectId(kc_id),
            'country_code': country_code
        })

        if cached:
            return cached['content']

        # If no cached context, could generate with LLM
        # For now, return None (frontend can request generation)
        return None

    def generate_cultural_bridge(self, kc_id: str, country_code: str) -> str:
        """
        Generate cultural context using LLM

        Args:
            kc_id: Knowledge component ID
            country_code: ISO country code

        Returns:
            Generated cultural context
        """
        # Get KC details
        kc = self.collections.knowledge_components.find_one({'_id': ObjectId(kc_id)})

        if not kc:
            return ""

        prompt = f"""
You are helping an immigrant from {country_code} learn about US financial concepts.

US Concept: {kc['name']}
Description: {kc.get('description', 'No description')}
Domain: {kc['domain']}

Generate a brief (2-3 sentences) explanation that:
1. Compares or relates this US concept to something familiar in {country_code}
2. Highlights key differences they should be aware of
3. Uses simple, clear language

Be helpful, accurate, and culturally sensitive.
"""

        try:
            response = self.llm.generate_with_fallback(
                prompt,
                default=f"This topic covers {kc['name']} in the US financial system.",
                max_tokens=200,
                temperature=0.7
            )
            return response
        except Exception as e:
            print(f"⚠️  Error generating cultural bridge: {e}")
            return f"This topic covers {kc['name']} in the US financial system."

    def personalize_item(self, item: Dict, learner: Dict) -> Dict:
        """
        Add personalization to a learning item

        Args:
            item: Learning item dict
            learner: Learner dict with country_of_origin, visa_type, etc.

        Returns:
            Personalized item dict
        """
        personalized = item.copy()

        country = learner.get('country_of_origin')
        visa = learner.get('visa_type')

        # Add cultural bridge
        if country and item.get('kc_id'):
            bridge = self.get_cultural_bridge(item['kc_id'], country)
            if bridge:
                personalized['cultural_bridge'] = bridge

        # Add visa-specific note
        if visa and 'content' in item:
            content = item['content']
            if 'visa_variants' in content:
                # Try exact match first
                visa_note = content['visa_variants'].get(visa)

                # Try case-insensitive match
                if not visa_note:
                    for variant_visa, note in content['visa_variants'].items():
                        if variant_visa.upper() == visa.upper():
                            visa_note = note
                            break

                if visa_note:
                    # Extract additional context if it's a dict
                    if isinstance(visa_note, dict):
                        personalized['visa_note'] = visa_note.get('additional_context', str(visa_note))
                    else:
                        personalized['visa_note'] = visa_note

        return personalized

    def generate_wrong_answer_explanation(self, item: Dict, learner_answer: str,
                                         learner: Dict) -> str:
        """
        Generate personalized explanation for wrong answer

        Args:
            item: Learning item dict
            learner_answer: The answer the learner selected
            learner: Learner dict with context

        Returns:
            Personalized explanation text
        """
        content = item.get('content', {})
        stem = content.get('stem', 'Question not available')
        correct_answer = content.get('correct_answer', 0)
        explanation = content.get('explanation', 'No explanation available')

        # Get choice text
        choices = content.get('choices', [])
        learner_choice_text = choices[learner_answer] if learner_answer < len(choices) else "Unknown"
        correct_choice_text = choices[correct_answer] if correct_answer < len(choices) else "Unknown"

        country = learner.get('country_of_origin', 'Unknown')
        english_level = learner.get('english_proficiency', 'intermediate')

        prompt = f"""
A learner answered a financial literacy question incorrectly. Help them understand why.

Question: {stem}
Their answer: {learner_choice_text}
Correct answer: {correct_choice_text}
Standard explanation: {explanation}

Learner context:
- From: {country}
- English level: {english_level}

Generate a helpful, encouraging 2-3 sentence explanation that:
1. Acknowledges their thinking without making them feel bad
2. Clearly explains why the correct answer is right
3. If relevant, connects to their background from {country}

Keep it simple, warm, and supportive. Adjust complexity for {english_level} English level.
"""

        try:
            response = self.llm.generate_with_fallback(
                prompt,
                default=explanation,
                max_tokens=300,
                temperature=0.7
            )
            return response
        except Exception as e:
            print(f"⚠️  Error generating explanation: {e}")
            return explanation

    def generate_hint(self, item: Dict, learner: Dict) -> str:
        """
        Generate a helpful hint without giving away the answer

        Args:
            item: Learning item dict
            learner: Learner dict with context

        Returns:
            Hint text
        """
        content = item.get('content', {})
        stem = content.get('stem', 'Question not available')
        explanation = content.get('explanation', '')

        country = learner.get('country_of_origin', 'Unknown')
        english_level = learner.get('english_proficiency', 'intermediate')

        prompt = f"""
A learner is stuck on this financial literacy question and needs a hint.

Question: {stem}
Full explanation (don't reveal this): {explanation}

Learner context:
- From: {country}
- English level: {english_level}

Generate a helpful hint (1-2 sentences) that:
1. Guides them toward the right answer without revealing it
2. Focuses on key concepts they should consider
3. Is encouraging and supportive

Don't give away the answer directly. Just point them in the right direction.
"""

        try:
            response = self.llm.generate_with_fallback(
                prompt,
                default="Think about the key principles of this topic and which option aligns best with those principles.",
                max_tokens=200,
                temperature=0.7
            )
            return response
        except Exception as e:
            print(f"⚠️  Error generating hint: {e}")
            return "Think about the key principles of this topic and which option aligns best with those principles."

    def simplify_explanation(self, text: str, english_level: str = "intermediate") -> str:
        """
        Simplify an explanation for lower English proficiency

        Args:
            text: Original explanation text
            english_level: beginner, intermediate, or advanced

        Returns:
            Simplified text
        """
        if english_level == "advanced":
            return text  # No simplification needed

        level_guidance = {
            "beginner": "Use very simple words and short sentences. Avoid idioms and complex grammar.",
            "intermediate": "Use clear, straightforward language. Avoid jargon unless explained."
        }

        guidance = level_guidance.get(english_level, level_guidance["intermediate"])

        prompt = f"""
Rewrite this financial explanation for someone with {english_level} English proficiency.

Original text:
{text}

Guidelines: {guidance}

Rewritten version:
"""

        try:
            response = self.llm.generate_with_fallback(
                prompt,
                default=text,
                max_tokens=300,
                temperature=0.5
            )
            return response
        except Exception as e:
            print(f"⚠️  Error simplifying text: {e}")
            return text

    def generate_encouragement(self, learner: Dict, context: str = "general") -> str:
        """
        Generate encouraging message for learner

        Args:
            learner: Learner dict
            context: "correct", "incorrect", "streak", "mastery", etc.

        Returns:
            Encouraging message
        """
        name = learner.get('display_name', 'learner')
        country = learner.get('country_of_origin', '')

        context_prompts = {
            "correct": f"Generate a brief (1 sentence) encouraging message for {name} who just answered correctly.",
            "incorrect": f"Generate a brief (1 sentence) supportive message for {name} who just got an answer wrong. Be encouraging.",
            "streak": f"Generate a brief (1 sentence) celebratory message for {name} who is on a learning streak.",
            "mastery": f"Generate a brief (1 sentence) congratulatory message for {name} who just mastered a new skill."
        }

        prompt = context_prompts.get(context, f"Generate a brief encouraging message for {name}.")

        if country:
            prompt += f" They're from {country} learning about US finance."

        prompt += " Be warm, specific, and motivating. One sentence only."

        try:
            response = self.llm.generate_with_fallback(
                prompt,
                default="Great work! Keep it up!",
                max_tokens=100,
                temperature=0.8
            )
            return response
        except Exception as e:
            print(f"⚠️  Error generating encouragement: {e}")
            return "Great work! Keep it up!"
