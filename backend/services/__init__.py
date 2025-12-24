"""
Algorithm services for FinLit adaptive learning platform

This package provides adaptive learning algorithms:
- BKT (Bayesian Knowledge Tracing): Track skill mastery
- FSRS (Free Spaced Repetition Scheduler): Optimize review timing
- IRT (Item Response Theory): Calibrate item difficulty
- ContentSelector: Select optimal learning items
- LearningEngine: Unified interface to all services
"""

from .bkt import BayesianKnowledgeTracer, BKTParams
from .scheduler import FSRSScheduler
from .irt import IRTCalibrator
from .content_selector import ContentSelector
from .learning_engine import LearningEngine

__all__ = [
    'BayesianKnowledgeTracer',
    'BKTParams',
    'FSRSScheduler',
    'IRTCalibrator',
    'ContentSelector',
    'LearningEngine'
]
