"""
KCPrerequisite model - defines prerequisite relationships between knowledge components
"""
from sqlalchemy import Column, Boolean, ForeignKey, PrimaryKeyConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from config.database import db


class KCPrerequisite(db.Model):
    __tablename__ = 'kc_prerequisites'

    kc_id = Column(UUID(as_uuid=True), ForeignKey('knowledge_components.kc_id'), nullable=False)
    prerequisite_kc_id = Column(UUID(as_uuid=True), ForeignKey('knowledge_components.kc_id'), nullable=False)
    is_required = Column(Boolean, default=True)

    # Composite primary key
    # Check constraint to prevent self-referencing
    __table_args__ = (
        PrimaryKeyConstraint('kc_id', 'prerequisite_kc_id'),
        CheckConstraint('kc_id != prerequisite_kc_id', name='no_self_reference'),
    )

    # Relationships
    knowledge_component = relationship(
        'KnowledgeComponent',
        foreign_keys=[kc_id],
        backref='prerequisites'
    )
    prerequisite = relationship(
        'KnowledgeComponent',
        foreign_keys=[prerequisite_kc_id],
        backref='dependent_kcs'
    )

    def __repr__(self):
        return f"<KCPrerequisite(kc_id={self.kc_id}, prerequisite_kc_id={self.prerequisite_kc_id}, is_required={self.is_required})>"

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'kc_id': str(self.kc_id),
            'prerequisite_kc_id': str(self.prerequisite_kc_id),
            'is_required': self.is_required
        }
