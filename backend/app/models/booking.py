from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin

class Booking(Base, TimestampMixin):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    schedule_id = Column(Integer, ForeignKey("class_schedules.id"), nullable=False)
    status = Column(String(50), default="confirmed") # "confirmed", "cancelled", "attended", "no-show"
    notes = Column(Text, nullable=True)

    member = relationship("Member", back_populates="bookings")
    schedule = relationship("Schedule", back_populates="bookings")

    __table_args__ = (
        # Ensure a member cannot book the same class schedule twice unless cancelled
        # UniqueConstraint("member_id", "schedule_id", name="uq_member_schedule"),
    )
