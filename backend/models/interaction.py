"""
Interaction model - records a learner's response to a learning item
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, Float, JSON, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from config.database import db


class Interaction(db.Model):
    __tablename__ = 'interactions'

    interaction_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    learner_id = Column(UUID(as_uuid=True), ForeignKey('learners.learner_id'), nullable=False)
    item_id = Column(UUID(as_uuid=True), ForeignKey('learning_items.item_id'), nullable=False)
    kc_id = Column(UUID(as_uuid=True), ForeignKey('knowledge_components.kc_id'), nullable=False)
    session_id = Column(UUID(as_uuid=True), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    response_value = Column(JSON)
    response_time_ms = Column(Integer)
    hint_used = Column(Boolean, default=False)
    p_mastery_before = Column(Float)
    retrievability_before = Column(Float)
    days_since_last_review = Column(Float)
    selection_method = Column(String(30))
    predicted_p_correct = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    learner = relationship('Learner', backref='interactions')
    learning_item = relationship('LearningItem', backref='interactions')
    knowledge_component = relationship('KnowledgeComponent', backref='interactions')

    # Indexes for query performance
    __table_args__ = (
        Index('idx_learner_created', 'learner_id', 'created_at'),
        Index('idx_item_id', 'item_id'),
    )

    def __repr__(self):
        return f"<Interaction(id={self.interaction_id}, learner_id={self.learner_id}, item_id={self.item_id}, is_correct={self.is_correct})>"

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'interaction_id': str(self.interaction_id),
            'learner_id': str(self.learner_id),
            'item_id': str(self.item_id),
            'kc_id': str(self.kc_id),
            'session_id': str(self.session_id),
            'is_correct': self.is_correct,
            'response_value': self.response_value,
            'response_time_ms': self.response_time_ms,
            'hint_used': self.hint_used,
            'p_mastery_before': self.p_mastery_before,
            'retrievability_before': self.retrievability_before,
            'days_since_last_review': self.days_since_last_review,
            'selection_method': self.selection_method,
            'predicted_p_correct': self.predicted_p_correct,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
