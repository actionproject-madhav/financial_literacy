"""
Personalization Service - LLM-powered content personalization + Course Prioritization

This service personalizes learning content for individual learners based on:
- Country of origin
- Visa type
- English proficiency
- Learning history
- Financial goals
- Diagnostic test results

Uses LLM to generate culturally relevant explanations and context.
Also calculates personalized course recommendations based on profile + diagnostic data.
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from bson import ObjectId
from .llm_service import get_llm_service


# ============= COURSE PRIORITIZATION CONSTANTS =============

# Domain to financial goals mapping
GOAL_DOMAIN_MAPPING = {
    'emergency_fund': ['budgeting', 'banking'],
    'credit_score': ['credit', 'banking'],
    'retirement': ['retirement', 'investing'],
    'home_purchase': ['credit', 'budgeting', 'investing'],
    'investing': ['investing', 'retirement'],
    'debt_payoff': ['credit', 'budgeting'],
    'tax_planning': ['taxes'],
    'remittances': ['banking', 'immigration_finance'],
}

# Domain difficulty/advancement level (1=basic, 3=advanced)
DOMAIN_LEVELS = {
    'banking': 1,
    'budgeting': 1,
    'credit': 2,
    'taxes': 2,
    'immigration_finance': 2,
    'investing': 3,
    'retirement': 3,
    'insurance': 2,
    'cryptocurrency': 3,
}

# Countries where users likely know US basics (US territories, etc.)
US_FAMILIAR_COUNTRIES = {'USA', 'US', 'PRI', 'GUM', 'VIR', 'ASM'}


@dataclass
class CourseRecommendation:
    """Represents a personalized course recommendation."""
    domain: str
    priority_score: float  # 0-100, higher = show first
    recommendation_type: str  # 'priority', 'suggested', 'optional', 'mastered'
    reason: str
    blur_level: float  # 0 = normal, 0.5 = slight blur, 1 = heavy blur


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


# ============= COURSE PRIORITIZATION SERVICE =============

class CoursePrioritizationService:
    """
    Service to calculate personalized course recommendations based on
    user profile (onboarding) + diagnostic test results.
    """

    def __init__(self, learner_profile: Dict, diagnostic_results: Optional[Dict] = None):
        """
        Initialize with learner profile and optional diagnostic results.

        Args:
            learner_profile: Dict with keys like country_of_origin, financial_goals,
                           visa_type, financial_experience_level, etc.
            diagnostic_results: Optional dict with domain_mastery and domain_priority
        """
        self.profile = learner_profile

        # Extract key profile fields
        self.country = (learner_profile.get('country_of_origin') or '').upper()
        self.visa_type = learner_profile.get('visa_type') or ''
        self.goals = learner_profile.get('financial_goals') or []
        self.experience = learner_profile.get('financial_experience_level') or 'novice'
        self.has_ssn = learner_profile.get('has_ssn', False)
        self.sends_remittances = learner_profile.get('sends_remittances', False)

        # Diagnostic data
        self.domain_mastery = (diagnostic_results or {}).get('domain_mastery') or {}
        self.domain_priority = (diagnostic_results or {}).get('domain_priority') or []
        self.diagnostic_completed = learner_profile.get('diagnostic_test_completed', False)

    def is_us_resident(self) -> bool:
        """Check if user is from US or US territories."""
        return self.country in US_FAMILIAR_COUNTRIES

    def is_advanced_user(self) -> bool:
        """Check if user is likely advanced (US citizen, Green Card, experienced)."""
        advanced_visas = {'GREEN_CARD', 'CITIZEN'}
        advanced_experience = {'intermediate', 'advanced'}
        return (
            self.visa_type in advanced_visas or
            self.experience in advanced_experience or
            self.is_us_resident()
        )

    def get_goal_domains(self) -> List[str]:
        """Get domains that match user's financial goals."""
        relevant_domains = set()
        for goal in self.goals:
            if goal in GOAL_DOMAIN_MAPPING:
                relevant_domains.update(GOAL_DOMAIN_MAPPING[goal])
        return list(relevant_domains)

    def calculate_domain_priority(self, domain: str) -> Tuple[float, str, str]:
        """
        Calculate priority score for a domain.

        Returns:
            Tuple of (priority_score, recommendation_type, reason)
        """
        score = 50.0  # Base score
        reasons = []
        rec_type = 'suggested'

        # Factor 1: Diagnostic test results (most important if completed)
        if self.diagnostic_completed and domain in self.domain_mastery:
            mastery = self.domain_mastery[domain]

            if mastery < 0.3:
                # Very weak - highest priority
                score += 40
                reasons.append("needs focus based on assessment")
                rec_type = 'priority'
            elif mastery < 0.5:
                # Weak - high priority
                score += 25
                reasons.append("room for improvement")
                rec_type = 'priority'
            elif mastery >= 0.75:
                # Strong - lower priority
                score -= 30
                reasons.append("you're already strong here")
                rec_type = 'mastered' if mastery >= 0.9 else 'optional'

        # Factor 2: Financial goals alignment
        goal_domains = self.get_goal_domains()
        if domain in goal_domains:
            score += 20
            reasons.append("matches your goals")
            if rec_type != 'priority':
                rec_type = 'suggested'

        # Factor 3: User background (US resident vs immigrant)
        domain_level = DOMAIN_LEVELS.get(domain, 2)

        if self.is_us_resident() or self.is_advanced_user():
            # US users / advanced users: prioritize advanced, deprioritize basics
            if domain_level == 1:  # Basic domain
                score -= 25
                if not reasons:
                    reasons.append("basics you likely know")
                if rec_type == 'suggested':
                    rec_type = 'optional'
            elif domain_level == 3:  # Advanced domain
                score += 15
                reasons.append("advanced topic for your level")
        else:
            # New immigrants: prioritize basics first
            if domain_level == 1:
                score += 15
                reasons.append("essential foundation")
            elif domain_level == 3:
                score -= 10
                reasons.append("advanced - master basics first")

        # Factor 4: Visa-specific content
        if domain == 'immigration_finance':
            if self.visa_type not in {'GREEN_CARD', 'CITIZEN'} and not self.is_us_resident():
                score += 25
                reasons.append("relevant to your visa status")
            else:
                score -= 20
                if not reasons:
                    reasons.append("less relevant for citizens")

        # Factor 5: Remittances
        if domain == 'banking' and self.sends_remittances:
            score += 15
            reasons.append("important for sending money home")

        # Factor 6: No SSN considerations
        if not self.has_ssn and domain in ['credit', 'taxes']:
            score -= 5
            if not reasons:
                reasons.append("may need SSN first")

        # Clamp score
        score = max(0, min(100, score))

        # Create reason string
        reason = reasons[0] if reasons else "general recommendation"

        return score, rec_type, reason

    def get_personalized_recommendations(self, available_domains: List[str]) -> List[CourseRecommendation]:
        """
        Get personalized course recommendations for all available domains.

        Args:
            available_domains: List of domain IDs from the curriculum

        Returns:
            List of CourseRecommendation sorted by priority (highest first)
        """
        recommendations = []

        for domain in available_domains:
            score, rec_type, reason = self.calculate_domain_priority(domain)

            # Calculate blur level
            if rec_type == 'priority':
                blur = 0.0
            elif rec_type == 'suggested':
                blur = 0.0
            elif rec_type == 'optional':
                blur = 0.3
            else:  # mastered
                blur = 0.5

            recommendations.append(CourseRecommendation(
                domain=domain,
                priority_score=score,
                recommendation_type=rec_type,
                reason=reason,
                blur_level=blur
            ))

        # Sort by priority score (highest first)
        recommendations.sort(key=lambda x: x.priority_score, reverse=True)

        return recommendations

    def get_personalization_summary(self) -> Dict:
        """Get a summary of the personalization factors for debugging/display."""
        return {
            'is_us_resident': self.is_us_resident(),
            'is_advanced_user': self.is_advanced_user(),
            'goal_domains': self.get_goal_domains(),
            'diagnostic_completed': self.diagnostic_completed,
            'experience_level': self.experience,
            'visa_type': self.visa_type,
            'country': self.country,
        }


def get_personalized_course_order(
    learner_profile: Dict,
    available_domains: List[str]
) -> Tuple[List[Dict], Dict]:
    """
    Convenience function to get personalized course order.

    Args:
        learner_profile: Learner document from database (includes diagnostic fields)
        available_domains: List of domain IDs from curriculum

    Returns:
        Tuple of (sorted_recommendations as list of dicts, personalization_summary)
    """
    # Extract diagnostic results from profile
    diagnostic_results = {
        'domain_mastery': learner_profile.get('domain_mastery', {}),
        'domain_priority': learner_profile.get('domain_priority', []),
    }

    service = CoursePrioritizationService(learner_profile, diagnostic_results)
    recommendations = service.get_personalized_recommendations(available_domains)
    summary = service.get_personalization_summary()

    # Convert to dict format
    result = [
        {
            'domain': r.domain,
            'priority_score': r.priority_score,
            'recommendation_type': r.recommendation_type,
            'reason': r.reason,
            'blur_level': r.blur_level,
        }
        for r in recommendations
    ]

    return result, summary
