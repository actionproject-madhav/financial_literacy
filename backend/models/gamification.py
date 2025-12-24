"""
Gamification models - achievements, badges, and daily progress tracking
"""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Boolean, Text, Date, DateTime, JSON, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from config.database import db


class Achievement(db.Model):
    __tablename__ = 'achievements'

    achievement_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    icon_url = Column(String(500))
    xp_reward = Column(Integer, default=0)
    criteria = Column(JSON)

    def __repr__(self):
        return f"<Achievement(id={self.achievement_id}, slug={self.slug}, name={self.name})>"

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'achievement_id': str(self.achievement_id),
            'slug': self.slug,
            'name': self.name,
            'description': self.description,
            'icon_url': self.icon_url,
            'xp_reward': self.xp_reward,
            'criteria': self.criteria
        }


class LearnerAchievement(db.Model):
    __tablename__ = 'learner_achievements'

    learner_id = Column(UUID(as_uuid=True), ForeignKey('learners.learner_id'), nullable=False)
    achievement_id = Column(UUID(as_uuid=True), ForeignKey('achievements.achievement_id'), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Composite primary key
    __table_args__ = (
        PrimaryKeyConstraint('learner_id', 'achievement_id'),
    )

    # Relationships
    learner = relationship('Learner', backref='achievements')
    achievement = relationship('Achievement', backref='learner_achievements')

    def __repr__(self):
        return f"<LearnerAchievement(learner_id={self.learner_id}, achievement_id={self.achievement_id})>"

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'learner_id': str(self.learner_id),
            'achievement_id': str(self.achievement_id),
            'earned_at': self.earned_at.isoformat() if self.earned_at else None
        }


class DailyProgress(db.Model):
    __tablename__ = 'daily_progress'

    learner_id = Column(UUID(as_uuid=True), ForeignKey('learners.learner_id'), nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    xp_earned = Column(Integer, default=0)
    lessons_completed = Column(Integer, default=0)
    minutes_practiced = Column(Integer, default=0)
    goal_met = Column(Boolean, default=False)

    # Composite primary key
    __table_args__ = (
        PrimaryKeyConstraint('learner_id', 'date'),
    )

    # Relationships
    learner = relationship('Learner', backref='daily_progress')

    def __repr__(self):
        return f"<DailyProgress(learner_id={self.learner_id}, date={self.date}, xp_earned={self.xp_earned})>"

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'learner_id': str(self.learner_id),
            'date': self.date.isoformat() if self.date else None,
            'xp_earned': self.xp_earned,
            'lessons_completed': self.lessons_completed,
            'minutes_practiced': self.minutes_practiced,
            'goal_met': self.goal_met
        }
