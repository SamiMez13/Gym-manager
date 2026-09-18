from sqlalchemy import Column, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    membership_id = Column(Integer, ForeignKey("memberships.id"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    type = Column(String(50), default="membership") # "membership", "drop-in", "personal-training"
    status = Column(String(50), default="completed") # "completed", "pending", "failed", "refunded"
    method = Column(String(50), default="credit_card") # "credit_card", "cash", "bank_transfer"
    notes = Column(Text, nullable=True)

    member = relationship("Member", back_populates="payments")
    membership = relationship("Membership", back_populates="payments")
