from typing import Optional
from app.schemas.common import CamelModel

class BranchBase(CamelModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    capacity: Optional[int] = 100
    is_active: Optional[bool] = True

class BranchCreate(BranchBase):
    pass

class BranchUpdate(CamelModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    capacity: Optional[int] = None
    is_active: Optional[bool] = None

class BranchOut(BranchBase):
    id: int
