from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin

class Schedule(Base, TimestampMixin):
    __tablename__ = "class_schedules"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("gym_classes.id"), nullable=False)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(50), default="scheduled") # "scheduled", "completed", "cancelled"
    notes = Column(Text, nullable=True)

    gym_class = relationship("GymClass", back_populates="schedules")
    trainer = relationship("Trainer", back_populates="schedules")
    branch = relationship("Branch", back_populates="schedules")
    bookings = relationship("Booking", back_populates="schedule", cascade="all, delete-orphan")
