from datetime import date
from typing import Optional
from app.schemas.common import CamelModel

class MembershipPlanBase(CamelModel):
    name: str
    description: Optional[str] = None
    duration_days: Optional[int] = 30
    price: float
    max_classes_per_month: Optional[int] = 12
    is_active: Optional[bool] = True

class MembershipPlanCreate(MembershipPlanBase):
    pass

class MembershipPlanUpdate(CamelModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_days: Optional[int] = None
    price: Optional[float] = None
    max_classes_per_month: Optional[int] = None
    is_active: Optional[bool] = None

class MembershipPlanOut(MembershipPlanBase):
    id: int


class MembershipBase(CamelModel):
    member_id: int
    plan_id: int
    start_date: date
    end_date: date
    status: Optional[str] = "active"

class MembershipCreate(MembershipBase):
    pass

class MembershipUpdate(CamelModel):
    plan_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None

class MembershipOut(MembershipBase):
    id: int
    member_name: Optional[str] = None
    plan_name: Optional[str] = None
    price: Optional[float] = None
