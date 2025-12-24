"""
KnowledgeComponent model - represents a skill or concept in the learning system
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from config.database import Base


class KnowledgeComponent(Base):
    __tablename__ = 'knowledge_components'

    kc_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    domain = Column(String(50), nullable=False)
    parent_kc_id = Column(UUID(as_uuid=True), ForeignKey('knowledge_components.kc_id'), nullable=True)
    difficulty_tier = Column(Integer, default=1)
    bloom_level = Column(String(20))
    estimated_minutes = Column(Integer, default=15)
    icon_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Self-referential relationship for parent-child hierarchy
    parent = relationship('KnowledgeComponent', remote_side=[kc_id], backref='children')

    def __repr__(self):
        return f"<KnowledgeComponent(id={self.kc_id}, slug={self.slug}, name={self.name})>"

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'kc_id': str(self.kc_id),
            'slug': self.slug,
            'name': self.name,
            'description': self.description,
            'domain': self.domain,
            'parent_kc_id': str(self.parent_kc_id) if self.parent_kc_id else None,
            'difficulty_tier': self.difficulty_tier,
            'bloom_level': self.bloom_level,
            'estimated_minutes': self.estimated_minutes,
            'icon_url': self.icon_url,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
