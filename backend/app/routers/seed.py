from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.seed_data import seed_database

router = APIRouter(prefix="/seed", tags=["Seed"])

@router.post("")
def trigger_seed(force: bool = Query(False), db: Session = Depends(get_db)):
    result = seed_database(db, force=force)
    return result
