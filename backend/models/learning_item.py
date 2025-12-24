"""
LearningItem model - represents a question, video, or interactive learning content
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, Float, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from config.database import db


class LearningItem(db.Model):
    __tablename__ = 'learning_items'

    item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_type = Column(String(30), nullable=False)  # 'multiple_choice', 'video', 'interactive'
    content = Column(JSON, nullable=False)  # stores stem, choices, correct_answer, explanation, visa_variants
    difficulty = Column(Float, default=0.5)
    discrimination = Column(Float, default=1.0)
    response_count = Column(Integer, default=0)
    correct_rate = Column(Float)
    avg_response_time_ms = Column(Integer)
    media_type = Column(String(20))
    media_url = Column(String(500))
    allows_llm_personalization = Column(Boolean, default=True)
    forgetting_curve_factor = Column(Float, default=1.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<LearningItem(id={self.item_id}, type={self.item_type}, difficulty={self.difficulty})>"

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'item_id': str(self.item_id),
            'item_type': self.item_type,
            'content': self.content,
            'difficulty': self.difficulty,
            'discrimination': self.discrimination,
            'response_count': self.response_count,
            'correct_rate': self.correct_rate,
            'avg_response_time_ms': self.avg_response_time_ms,
            'media_type': self.media_type,
            'media_url': self.media_url,
            'allows_llm_personalization': self.allows_llm_personalization,
            'forgetting_curve_factor': self.forgetting_curve_factor,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
