"""
ItemKCMapping model - maps learning items to knowledge components
"""
from sqlalchemy import Column, Float, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from config.database import db


class ItemKCMapping(db.Model):
    __tablename__ = 'item_kc_mappings'

    item_id = Column(UUID(as_uuid=True), ForeignKey('learning_items.item_id'), nullable=False)
    kc_id = Column(UUID(as_uuid=True), ForeignKey('knowledge_components.kc_id'), nullable=False)
    weight = Column(Float, default=1.0)

    # Composite primary key
    __table_args__ = (
        PrimaryKeyConstraint('item_id', 'kc_id'),
    )

    # Relationships
    learning_item = relationship('LearningItem', backref='kc_mappings')
    knowledge_component = relationship('KnowledgeComponent', backref='item_mappings')

    def __repr__(self):
        return f"<ItemKCMapping(item_id={self.item_id}, kc_id={self.kc_id}, weight={self.weight})>"

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'item_id': str(self.item_id),
            'kc_id': str(self.kc_id),
            'weight': self.weight
        }
