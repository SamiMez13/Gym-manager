from datetime import datetime
from typing import Optional
from app.schemas.common import CamelModel

class ScheduleBase(CamelModel):
    class_id: int
    trainer_id: int
    branch_id: int
    start_time: datetime
    end_time: datetime
    status: Optional[str] = "scheduled"
    notes: Optional[str] = None

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleUpdate(CamelModel):
    class_id: Optional[int] = None
    trainer_id: Optional[int] = None
    branch_id: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class ScheduleOut(ScheduleBase):
    id: int
    class_name: Optional[str] = None
    max_capacity: Optional[int] = None
    trainer_name: Optional[str] = None
    branch_name: Optional[str] = None
    current_bookings: Optional[int] = 0
