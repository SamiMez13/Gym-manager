from datetime import date
from typing import Optional
from app.schemas.common import CamelModel

class MemberBase(CamelModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    is_active: Optional[bool] = True

class MemberCreate(MemberBase):
    pass

class MemberUpdate(CamelModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    is_active: Optional[bool] = None

class MemberOut(MemberBase):
    id: int
