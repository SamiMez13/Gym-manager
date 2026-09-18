from datetime import datetime
from typing import Optional
from app.schemas.common import CamelModel

class BookingBase(CamelModel):
    member_id: int
    schedule_id: int
    status: Optional[str] = "confirmed"
    notes: Optional[str] = None

class BookingCreate(BookingBase):
    pass

class BookingUpdate(CamelModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class BookingOut(BookingBase):
    id: int
    created_at: Optional[datetime] = None
    member_name: Optional[str] = None
    class_name: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
