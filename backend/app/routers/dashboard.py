from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.dashboard_service import DashboardService
from app.schemas.common import to_camel_dict

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    return to_camel_dict(DashboardService.get_stats(db))

@router.get("/revenue-summary")
def get_revenue_summary(db: Session = Depends(get_db)):
    return to_camel_dict(DashboardService.get_revenue_summary(db))

@router.get("/class-utilization")
def get_class_utilization(db: Session = Depends(get_db)):
    return to_camel_dict(DashboardService.get_class_utilization(db))

@router.get("/recent-activity")
def get_recent_activity(db: Session = Depends(get_db)):
    return to_camel_dict(DashboardService.get_recent_activity(db))
