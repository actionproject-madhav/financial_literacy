"""
LearnerSkillState model - tracks a learner's mastery of a knowledge component
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from config.database import db


class LearnerSkillState(db.Model):
    __tablename__ = 'learner_skill_states'

    learner_id = Column(UUID(as_uuid=True), ForeignKey('learners.learner_id'), nullable=False)
    kc_id = Column(UUID(as_uuid=True), ForeignKey('knowledge_components.kc_id'), nullable=False)
    p_mastery = Column(Float, default=0.1)
    stability_days = Column(Float, default=1.0)
    difficulty = Column(Float, default=0.3)
    retrievability = Column(Float, default=1.0)
    total_attempts = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    best_streak = Column(Integer, default=0)
    last_practiced_at = Column(DateTime)
    next_review_at = Column(DateTime)
    interval_days = Column(Integer, default=1)
    status = Column(String(20), default='locked')  # 'locked', 'available', 'in_progress', 'mastered'
    unlocked_at = Column(DateTime)
    mastered_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Composite primary key
    __table_args__ = (
        PrimaryKeyConstraint('learner_id', 'kc_id'),
    )

    # Relationships
    learner = relationship('Learner', backref='skill_states')
    knowledge_component = relationship('KnowledgeComponent', backref='learner_states')

    def __repr__(self):
        return f"<LearnerSkillState(learner_id={self.learner_id}, kc_id={self.kc_id}, p_mastery={self.p_mastery}, status={self.status})>"

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'learner_id': str(self.learner_id),
            'kc_id': str(self.kc_id),
            'p_mastery': self.p_mastery,
            'stability_days': self.stability_days,
            'difficulty': self.difficulty,
            'retrievability': self.retrievability,
            'total_attempts': self.total_attempts,
            'correct_count': self.correct_count,
            'current_streak': self.current_streak,
            'best_streak': self.best_streak,
            'last_practiced_at': self.last_practiced_at.isoformat() if self.last_practiced_at else None,
            'next_review_at': self.next_review_at.isoformat() if self.next_review_at else None,
            'interval_days': self.interval_days,
            'status': self.status,
            'unlocked_at': self.unlocked_at.isoformat() if self.unlocked_at else None,
            'mastered_at': self.mastered_at.isoformat() if self.mastered_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
