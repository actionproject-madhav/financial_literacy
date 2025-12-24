"""
Learner model - represents a user in the FinLit system
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, Date, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from config.database import Base


class Learner(Base):
    __tablename__ = 'learners'

    learner_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    display_name = Column(String(255))
    native_language = Column(String(50))
    english_proficiency = Column(String(50), default='intermediate')
    immigration_status = Column(String(50))
    financial_experience_level = Column(String(50), default='novice')
    daily_goal_minutes = Column(Integer, default=10)
    timezone = Column(String(50), default='America/New_York')
    streak_count = Column(Integer, default=0)
    streak_last_date = Column(Date)
    total_xp = Column(Integer, default=0)
    country_of_origin = Column(String(100))
    visa_type = Column(String(50))
    has_ssn = Column(Boolean)
    sends_remittances = Column(Boolean)
    financial_goals = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_active_at = Column(DateTime)

    def __repr__(self):
        return f"<Learner(id={self.learner_id}, email={self.email}, display_name={self.display_name})>"

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'learner_id': str(self.learner_id),
            'email': self.email,
            'display_name': self.display_name,
            'native_language': self.native_language,
            'english_proficiency': self.english_proficiency,
            'immigration_status': self.immigration_status,
            'financial_experience_level': self.financial_experience_level,
            'daily_goal_minutes': self.daily_goal_minutes,
            'timezone': self.timezone,
            'streak_count': self.streak_count,
            'streak_last_date': self.streak_last_date.isoformat() if self.streak_last_date else None,
            'total_xp': self.total_xp,
            'country_of_origin': self.country_of_origin,
            'visa_type': self.visa_type,
            'has_ssn': self.has_ssn,
            'sends_remittances': self.sends_remittances,
            'financial_goals': self.financial_goals,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_active_at': self.last_active_at.isoformat() if self.last_active_at else None
        }
