"""
Algorithm services for FinLit adaptive learning platform

This package provides adaptive learning algorithms:
- BKT (Bayesian Knowledge Tracing): Track skill mastery
- FSRS (Free Spaced Repetition Scheduler): Optimize review timing
- IRT (Item Response Theory): Calibrate item difficulty
- ContentSelector: Select optimal learning items
- LearningEngine: Unified interface to all services
- PersonalizationService: LLM-powered content personalization
- LLMService: Multi-provider LLM wrapper
"""

from .bkt import BayesianKnowledgeTracer, BKTParams
from .scheduler import FSRSScheduler
from .irt import IRTCalibrator
from .content_selector import ContentSelector
from .learning_engine import LearningEngine
from .personalization import PersonalizationService
from .llm_service import LLMService, get_llm_service, generate_content

__all__ = [
    'BayesianKnowledgeTracer',
    'BKTParams',
    'FSRSScheduler',
    'IRTCalibrator',
    'ContentSelector',
    'LearningEngine',
    'PersonalizationService',
    'LLMService',
    'get_llm_service',
    'generate_content'
]
