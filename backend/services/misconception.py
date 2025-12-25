"""
Misconception Detection Service

This service detects common learning misconceptions from wrong answers,
tracks patterns across learners, and provides targeted remediation.
"""

import os
from typing import Dict, List, Optional
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv
from sklearn.cluster import DBSCAN
import numpy as np

load_dotenv()


class MisconceptionDetector:
    """
    Detect and track learning misconceptions

    Features:
    - Pattern detection in wrong answers
    - Country-specific misconception tracking
    - Remediation content suggestions
    - Clustering similar wrong answers
    """

    def __init__(self, collections):
        """
        Initialize detector with database collections

        Args:
            collections: FinLitCollections instance
        """
        self.collections = collections
        self.db = collections.db
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

        # Initialize misconceptions collection if not exists
        if 'misconceptions' not in self.db.list_collection_names():
            self.db.create_collection('misconceptions')
        if 'learner_misconceptions' not in self.db.list_collection_names():
            self.db.create_collection('learner_misconceptions')
        if 'voice_responses' not in self.db.list_collection_names():
            self.db.create_collection('voice_responses')

        self.misconceptions = self.db.misconceptions
        self.learner_misconceptions = self.db.learner_misconceptions
        self.voice_responses = self.db.voice_responses

    def detect(
        self,
        kc_id: str,
        spoken_answer: str,
        correct_answer: str,
        learner_country: str,
        explanation: str = ""
    ) -> Dict:
        """
        Detect if answer reveals a known misconception

        Args:
            kc_id: Knowledge component ID
            spoken_answer: What the learner said
            correct_answer: The correct answer
            learner_country: Learner's country of origin
            explanation: Explanation of correct answer

        Returns:
            {
                'misconception_detected': bool,
                'misconception_id': str or None,
                'misconception_type': str,
                'description': str,
                'remediation': {
                    'content': str,
                    'review_skills': [str]
                }
            }
        """
        try:
            # Check against known misconceptions for this KC
            known_misconceptions = list(self.misconceptions.find({
                'kc_id': kc_id,
                'countries_affected': {'$in': [learner_country, 'global']}
            }))

            if not known_misconceptions:
                # No known misconceptions, use LLM to analyze
                return self._analyze_new_misconception(
                    kc_id, spoken_answer, correct_answer, learner_country, explanation
                )

            # Check if spoken answer matches any known misconception pattern
            for misconception in known_misconceptions:
                if self._matches_pattern(spoken_answer, misconception):
                    # Increment occurrence count
                    self.misconceptions.update_one(
                        {'_id': misconception['_id']},
                        {
                            '$inc': {'occurrence_count': 1},
                            '$set': {'last_detected_at': datetime.utcnow()}
                        }
                    )

                    return {
                        'misconception_detected': True,
                        'misconception_id': str(misconception['_id']),
                        'misconception_type': misconception['pattern_type'],
                        'description': misconception['description'],
                        'remediation': misconception.get('remediation_content', {})
                    }

            # No match with known patterns, analyze as new
            return self._analyze_new_misconception(
                kc_id, spoken_answer, correct_answer, learner_country, explanation
            )

        except Exception as e:
            print(f"Error detecting misconception: {e}")
            return {
                'misconception_detected': False,
                'misconception_id': None,
                'misconception_type': 'unknown',
                'description': '',
                'remediation': {}
            }

    def _matches_pattern(self, spoken_answer: str, misconception: Dict) -> bool:
        """
        Check if spoken answer matches a misconception pattern

        Args:
            spoken_answer: Learner's answer
            misconception: Misconception document

        Returns:
            True if matches pattern
        """
        # Simple keyword matching for now
        # Could be enhanced with semantic similarity
        examples = misconception.get('example_responses', [])
        spoken_lower = spoken_answer.lower()

        # Check for keyword overlap
        for example in examples:
            example_lower = example.lower()
            # Simple approach: if 50% of words overlap, consider it a match
            spoken_words = set(spoken_lower.split())
            example_words = set(example_lower.split())
            overlap = spoken_words.intersection(example_words)

            if len(overlap) >= len(example_words) * 0.5:
                return True

        return False

    def _analyze_new_misconception(
        self,
        kc_id: str,
        spoken_answer: str,
        correct_answer: str,
        learner_country: str,
        explanation: str
    ) -> Dict:
        """
        Use LLM to analyze if answer reveals a misconception

        Args:
            kc_id: Knowledge component ID
            spoken_answer: Learner's wrong answer
            correct_answer: Correct answer
            learner_country: Learner's country
            explanation: Explanation of correct answer

        Returns:
            Misconception analysis
        """
        try:
            prompt = f"""Analyze this wrong answer from a financial literacy learner.

Learner's country: {learner_country}
Correct answer: {correct_answer}
Explanation: {explanation}
Learner's answer: "{spoken_answer}"

Determine if this reveals a specific misconception. Consider:
1. Is this a random guess or a systematic misunderstanding?
2. Does this suggest confusion with a related concept?
3. Might this be due to different financial system in their home country?

Respond in JSON format:
{{
    "has_misconception": true/false,
    "misconception_type": "confusion" | "partial_understanding" | "foreign_concept_transfer" | "none",
    "description": "brief description of the misconception",
    "likely_cause": "explanation of why they might think this",
    "remediation_suggestion": "what content would help correct this"
}}"""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a learning science expert analyzing student misconceptions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            import json
            analysis = json.loads(response.choices[0].message.content)

            if analysis.get('has_misconception'):
                return {
                    'misconception_detected': True,
                    'misconception_id': None,  # New misconception, not yet stored
                    'misconception_type': analysis['misconception_type'],
                    'description': analysis['description'],
                    'remediation': {
                        'content': analysis['remediation_suggestion'],
                        'review_skills': []
                    },
                    '_analysis': analysis  # Include full analysis for potential storage
                }
            else:
                return {
                    'misconception_detected': False,
                    'misconception_id': None,
                    'misconception_type': 'none',
                    'description': '',
                    'remediation': {}
                }

        except Exception as e:
            print(f"Error analyzing new misconception: {e}")
            return {
                'misconception_detected': False,
                'misconception_id': None,
                'misconception_type': 'unknown',
                'description': '',
                'remediation': {}
            }

    def log_misconception(self, learner_id: str, misconception_id: str):
        """
        Track that a learner exhibited a specific misconception

        Args:
            learner_id: Learner's ID
            misconception_id: Misconception ID
        """
        try:
            # Check if already tracked
            existing = self.learner_misconceptions.find_one({
                'learner_id': learner_id,
                'misconception_id': misconception_id
            })

            if existing:
                # Increment count
                self.learner_misconceptions.update_one(
                    {'_id': existing['_id']},
                    {
                        '$inc': {'times_detected': 1},
                        '$set': {'last_detected_at': datetime.utcnow()}
                    }
                )
            else:
                # Create new tracking
                self.learner_misconceptions.insert_one({
                    'learner_id': learner_id,
                    'misconception_id': misconception_id,
                    'times_detected': 1,
                    'first_detected_at': datetime.utcnow(),
                    'last_detected_at': datetime.utcnow(),
                    'resolved': False,
                    'resolved_at': None
                })

        except Exception as e:
            print(f"Error logging misconception: {e}")

    def mark_misconception_resolved(self, learner_id: str, misconception_id: str):
        """
        Mark a misconception as resolved for a learner

        Args:
            learner_id: Learner's ID
            misconception_id: Misconception ID
        """
        try:
            self.learner_misconceptions.update_one(
                {
                    'learner_id': learner_id,
                    'misconception_id': misconception_id
                },
                {
                    '$set': {
                        'resolved': True,
                        'resolved_at': datetime.utcnow()
                    }
                }
            )
        except Exception as e:
            print(f"Error marking misconception resolved: {e}")

    def get_learner_misconceptions(self, learner_id: str, resolved: bool = False) -> List[Dict]:
        """
        Get all misconceptions for a learner

        Args:
            learner_id: Learner's ID
            resolved: If True, only return resolved misconceptions

        Returns:
            List of misconceptions with learner-specific data
        """
        try:
            query = {'learner_id': learner_id}
            if not resolved:
                query['resolved'] = False

            learner_miscs = list(self.learner_misconceptions.find(query))

            # Enrich with misconception details
            result = []
            for lm in learner_miscs:
                misc = self.misconceptions.find_one({'_id': lm['misconception_id']})
                if misc:
                    result.append({
                        **misc,
                        'times_detected': lm['times_detected'],
                        'first_detected_at': lm['first_detected_at'],
                        'last_detected_at': lm['last_detected_at'],
                        'resolved': lm['resolved']
                    })

            return result

        except Exception as e:
            print(f"Error getting learner misconceptions: {e}")
            return []

    def analyze_patterns(self, kc_id: str, min_occurrences: int = 5) -> List[Dict]:
        """
        Analyze all wrong answers for a skill to find new misconception patterns

        This should be run periodically as a batch job

        Args:
            kc_id: Knowledge component ID
            min_occurrences: Minimum number of similar wrong answers to form a pattern

        Returns:
            List of newly discovered misconception patterns
        """
        try:
            # Get all wrong voice responses for this KC
            wrong_responses = list(self.voice_responses.find({
                'kc_id': kc_id,
                'is_correct': False
            }))

            if len(wrong_responses) < min_occurrences:
                return []

            # Use semantic matcher to cluster similar wrong answers
            from services.semantic import SemanticMatcher
            matcher = SemanticMatcher()

            # Get embeddings for all wrong answers
            transcriptions = [r['transcription'] for r in wrong_responses]
            embeddings = [matcher.get_embedding_sync(t) for t in transcriptions]

            # Cluster using DBSCAN
            clustering = DBSCAN(eps=0.3, min_samples=min_occurrences, metric='cosine')
            labels = clustering.fit_predict(embeddings)

            # Extract clusters
            discovered_patterns = []
            for label in set(labels):
                if label == -1:  # Noise
                    continue

                # Get all responses in this cluster
                cluster_indices = [i for i, l in enumerate(labels) if l == label]
                cluster_responses = [wrong_responses[i] for i in cluster_indices]
                cluster_transcriptions = [transcriptions[i] for i in cluster_indices]

                # Get country distribution
                countries = [r.get('learner_country', 'unknown') for r in cluster_responses]
                country_counts = {}
                for country in countries:
                    country_counts[country] = country_counts.get(country, 0) + 1

                # Use LLM to describe the pattern
                description = self._describe_pattern(cluster_transcriptions)

                discovered_patterns.append({
                    'kc_id': kc_id,
                    'pattern_size': len(cluster_responses),
                    'example_responses': cluster_transcriptions[:5],
                    'description': description,
                    'countries_affected': list(country_counts.keys()),
                    'country_distribution': country_counts
                })

            return discovered_patterns

        except Exception as e:
            print(f"Error analyzing patterns: {e}")
            return []

    def _describe_pattern(self, example_responses: List[str]) -> str:
        """
        Use LLM to describe a misconception pattern

        Args:
            example_responses: Example wrong answers in the cluster

        Returns:
            Description of the misconception
        """
        try:
            examples_text = "\n".join([f"- {r}" for r in example_responses[:10]])

            prompt = f"""These are similar wrong answers from different learners for the same financial literacy question:

{examples_text}

What common misconception do these answers reveal? Provide a concise description (1-2 sentences)."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a learning science expert."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=100
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            print(f"Error describing pattern: {e}")
            return "Common misconception detected"

    def create_misconception(
        self,
        kc_id: str,
        pattern_type: str,
        description: str,
        example_responses: List[str],
        countries_affected: List[str],
        remediation_content: Optional[Dict] = None
    ) -> str:
        """
        Create a new misconception entry

        Args:
            kc_id: Knowledge component ID
            pattern_type: Type of misconception
            description: Description
            example_responses: Example wrong answers
            countries_affected: List of affected countries
            remediation_content: Remediation suggestions

        Returns:
            Misconception ID
        """
        try:
            misconception = {
                'kc_id': kc_id,
                'pattern_type': pattern_type,
                'description': description,
                'example_responses': example_responses,
                'remediation_content': remediation_content or {},
                'occurrence_count': len(example_responses),
                'countries_affected': countries_affected,
                'created_at': datetime.utcnow(),
                'last_detected_at': datetime.utcnow()
            }

            result = self.misconceptions.insert_one(misconception)
            return str(result.inserted_id)

        except Exception as e:
            print(f"Error creating misconception: {e}")
            return None
