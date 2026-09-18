from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class Branch(Base, TimestampMixin):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(120), nullable=True)
    capacity = Column(Integer, default=100)
    is_active = Column(Boolean, default=True)

    trainers = relationship("Trainer", back_populates="branch", cascade="all, delete-orphan")
    schedules = relationship("Schedule", back_populates="branch", cascade="all, delete-orphan")
