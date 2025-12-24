"""
Cultural context models - for personalized learning based on learner's background
"""
import uuid
from sqlalchemy import Column, String, Boolean, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from config.database import Base


class QuestionTemplate(Base):
    __tablename__ = 'question_templates'

    template_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kc_id = Column(UUID(as_uuid=True), ForeignKey('knowledge_components.kc_id'), nullable=True)
    stem_template = Column(Text, nullable=False)
    variable_ranges = Column(JSON)
    answer_formula = Column(Text)
    choices_template = Column(JSON)
    is_verified = Column(Boolean, default=True)

    # Relationships
    knowledge_component = relationship('KnowledgeComponent', backref='question_templates')

    def __repr__(self):
        return f"<QuestionTemplate(id={self.template_id}, kc_id={self.kc_id})>"

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'template_id': str(self.template_id),
            'kc_id': str(self.kc_id) if self.kc_id else None,
            'stem_template': self.stem_template,
            'variable_ranges': self.variable_ranges,
            'answer_formula': self.answer_formula,
            'choices_template': self.choices_template,
            'is_verified': self.is_verified
        }


class CulturalContext(Base):
    __tablename__ = 'cultural_contexts'

    context_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kc_id = Column(UUID(as_uuid=True), ForeignKey('knowledge_components.kc_id'), nullable=True)
    country_code = Column(String(3), nullable=False, index=True)
    context_type = Column(String(30))  # 'comparison', 'equivalent', 'warning'
    content = Column(Text, nullable=False)
    is_verified = Column(Boolean, default=True)

    # Relationships
    knowledge_component = relationship('KnowledgeComponent', backref='cultural_contexts')

    def __repr__(self):
        return f"<CulturalContext(id={self.context_id}, country_code={self.country_code}, context_type={self.context_type})>"

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'context_id': str(self.context_id),
            'kc_id': str(self.kc_id) if self.kc_id else None,
            'country_code': self.country_code,
            'context_type': self.context_type,
            'content': self.content,
            'is_verified': self.is_verified
        }
