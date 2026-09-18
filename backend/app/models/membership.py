from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class MembershipPlan(Base, TimestampMixin):
    __tablename__ = "membership_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    duration_days = Column(Integer, default=30)
    price = Column(Numeric(10, 2), nullable=False)
    max_classes_per_month = Column(Integer, default=12) # e.g. 0 for unlimited
    is_active = Column(Boolean, default=True)

    memberships = relationship("Membership", back_populates="plan")


class Membership(Base, TimestampMixin):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("membership_plans.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(50), default="active") # "active", "expired", "frozen", "cancelled"

    member = relationship("Member", back_populates="memberships")
    plan = relationship("MembershipPlan", back_populates="memberships")
    payments = relationship("Payment", back_populates="membership")
