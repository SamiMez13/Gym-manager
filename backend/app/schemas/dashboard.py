from datetime import datetime
from typing import Optional
from app.schemas.common import CamelModel

class DashboardStats(CamelModel):
    total_revenue: float
    active_members: int
    todays_classes: int
    active_memberships: int
    branch_count: int
    total_members: int

class RevenueMonth(CamelModel):
    month: str
    revenue: float

class ClassUtilization(CamelModel):
    class_name: str
    max_capacity: int
    bookings: float
    utilization: float

class RecentActivity(CamelModel):
    type: str # 'payment' or 'booking'
    occurred_at: Optional[datetime] = None
    title: str
    description: str
