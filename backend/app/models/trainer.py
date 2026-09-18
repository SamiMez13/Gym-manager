from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class Trainer(Base, TimestampMixin):
    __tablename__ = "trainers"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    specialization = Column(String(150), nullable=True)
    bio = Column(Text, nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    is_active = Column(Boolean, default=True)

    branch = relationship("Branch", back_populates="trainers")
    schedules = relationship("Schedule", back_populates="trainer")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()
