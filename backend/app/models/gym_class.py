from sqlalchemy import Boolean, Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin

class GymClass(Base, TimestampMixin):
    __tablename__ = "gym_classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=True) # e.g. "Strength", "Cardio", "Yoga", "HIIT"
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=60)
    max_capacity = Column(Integer, default=20)
    difficulty_level = Column(String(50), default="All Levels") # "Beginner", "Intermediate", "Advanced", "All Levels"
    is_active = Column(Boolean, default=True)

    schedules = relationship("Schedule", back_populates="gym_class", cascade="all, delete-orphan")
