from datetime import datetime
from typing import Optional
from app.schemas.common import CamelModel

class PaymentBase(CamelModel):
    member_id: int
    membership_id: Optional[int] = None
    amount: float
    type: Optional[str] = "membership"
    status: Optional[str] = "completed"
    method: Optional[str] = "credit_card"
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(CamelModel):
    amount: Optional[float] = None
    status: Optional[str] = None
    method: Optional[str] = None
    notes: Optional[str] = None

class PaymentOut(PaymentBase):
    id: int
    created_at: Optional[datetime] = None
    member_name: Optional[str] = None
