from typing import Optional
from app.schemas.common import CamelModel

class GymClassBase(CamelModel):
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = 60
    max_capacity: Optional[int] = 20
    difficulty_level: Optional[str] = "All Levels"
    is_active: Optional[bool] = True

class GymClassCreate(GymClassBase):
    pass

class GymClassUpdate(CamelModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    max_capacity: Optional[int] = None
    difficulty_level: Optional[str] = None
    is_active: Optional[bool] = None

class GymClassOut(GymClassBase):
    id: int
