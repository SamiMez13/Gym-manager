from typing import Optional
from app.schemas.common import CamelModel

class TrainerBase(CamelModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    branch_id: Optional[int] = None
    is_active: Optional[bool] = True

class TrainerCreate(TrainerBase):
    pass

class TrainerUpdate(CamelModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    branch_id: Optional[int] = None
    is_active: Optional[bool] = None

class TrainerOut(TrainerBase):
    id: int
    branch_name: Optional[str] = None
