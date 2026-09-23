from typing import List, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.branch import Branch
from app.models.trainer import Trainer
from app.models.gym_class import GymClass
from app.models.schedule import Schedule
from app.models.booking import Booking

from app.schemas.branch import BranchCreate, BranchUpdate
from app.schemas.trainer import TrainerCreate, TrainerUpdate
from app.schemas.gym_class import GymClassCreate, GymClassUpdate
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate

class GymService:
    # --- Branches ---
    @staticmethod
    def get_branches(db: Session) -> List[Branch]:
        return db.query(Branch).order_by(Branch.id).all()

    @staticmethod
    def get_branch_by_id(db: Session, branch_id: int) -> Branch:
        branch = db.query(Branch).filter(Branch.id == branch_id).first()
        if not branch:
            raise HTTPException(status_code=404, detail="Branch not found")
        return branch

    @staticmethod
    def create_branch(db: Session, data: BranchCreate) -> Branch:
        branch = Branch(**data.model_dump())
        db.add(branch)
        db.commit()
        db.refresh(branch)
        return branch

    @staticmethod
    def update_branch(db: Session, branch_id: int, data: BranchUpdate) -> Branch:
        branch = GymService.get_branch_by_id(db, branch_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(branch, key, value)
        db.commit()
        db.refresh(branch)
        return branch

    @staticmethod
    def delete_branch(db: Session, branch_id: int) -> None:
        branch = GymService.get_branch_by_id(db, branch_id)
        db.delete(branch)
        db.commit()

    # --- Trainers ---
    @staticmethod
    def get_trainers(db: Session) -> List[Dict[str, Any]]:
        trainers = db.query(Trainer).order_by(Trainer.id).all()
        result = []
        for t in trainers:
            t_dict = {
                "id": t.id,
                "first_name": t.first_name,
                "last_name": t.last_name,
                "email": t.email,
                "phone": t.phone,
                "specialization": t.specialization,
                "bio": t.bio,
                "branch_id": t.branch_id,
                "is_active": t.is_active,
                "branch_name": t.branch.name if t.branch else None,
            }
            result.append(t_dict)
        return result

    @staticmethod
    def get_trainer_by_id(db: Session, trainer_id: int) -> Trainer:
        trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
        if not trainer:
            raise HTTPException(status_code=404, detail="Trainer not found")
        return trainer

    @staticmethod
    def create_trainer(db: Session, data: TrainerCreate) -> Trainer:
        trainer = Trainer(**data.model_dump())
        db.add(trainer)
        db.commit()
        db.refresh(trainer)
        return trainer

    @staticmethod
    def update_trainer(db: Session, trainer_id: int, data: TrainerUpdate) -> Trainer:
        trainer = GymService.get_trainer_by_id(db, trainer_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(trainer, key, value)
        db.commit()
        db.refresh(trainer)
        return trainer

    @staticmethod
    def delete_trainer(db: Session, trainer_id: int) -> None:
        trainer = GymService.get_trainer_by_id(db, trainer_id)
        db.delete(trainer)
        db.commit()

    # --- Gym Classes ---
    @staticmethod
    def get_classes(db: Session) -> List[GymClass]:
        return db.query(GymClass).order_by(GymClass.id).all()

    @staticmethod
    def get_class_by_id(db: Session, class_id: int) -> GymClass:
        gym_class = db.query(GymClass).filter(GymClass.id == class_id).first()
        if not gym_class:
            raise HTTPException(status_code=404, detail="Class not found")
        return gym_class

    @staticmethod
    def create_class(db: Session, data: GymClassCreate) -> GymClass:
        gym_class = GymClass(**data.model_dump())
        db.add(gym_class)
        db.commit()
        db.refresh(gym_class)
        return gym_class

    @staticmethod
    def update_class(db: Session, class_id: int, data: GymClassUpdate) -> GymClass:
        gym_class = GymService.get_class_by_id(db, class_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(gym_class, key, value)
        db.commit()
        db.refresh(gym_class)
        return gym_class

    @staticmethod
    def delete_class(db: Session, class_id: int) -> None:
        gym_class = GymService.get_class_by_id(db, class_id)
        db.delete(gym_class)
        db.commit()

    # --- Schedules ---
    @staticmethod
    def get_schedules(db: Session) -> List[Dict[str, Any]]:
        schedules = db.query(Schedule).order_by(Schedule.start_time).all()
        result = []
        for s in schedules:
            current_bookings = (
                db.query(func.count(Booking.id))
                .filter(Booking.schedule_id == s.id, Booking.status.notin_(["cancelled", "no-show"]))
                .scalar() or 0
            )
            result.append({
                "id": s.id,
                "class_id": s.class_id,
                "trainer_id": s.trainer_id,
                "branch_id": s.branch_id,
                "start_time": s.start_time,
                "end_time": s.end_time,
                "status": s.status,
                "notes": s.notes,
                "class_name": s.gym_class.name if s.gym_class else None,
                "max_capacity": s.gym_class.max_capacity if s.gym_class else None,
                "trainer_name": s.trainer.full_name if s.trainer else None,
                "branch_name": s.branch.name if s.branch else None,
                "current_bookings": current_bookings,
            })
        return result

    @staticmethod
    def get_schedule_by_id(db: Session, schedule_id: int) -> Schedule:
        schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")
        return schedule

    @staticmethod
    def create_schedule(db: Session, data: ScheduleCreate) -> Schedule:
        schedule = Schedule(**data.model_dump())
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        return schedule

    @staticmethod
    def update_schedule(db: Session, schedule_id: int, data: ScheduleUpdate) -> Schedule:
        schedule = GymService.get_schedule_by_id(db, schedule_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(schedule, key, value)
        db.commit()
        db.refresh(schedule)
        return schedule

    @staticmethod
    def delete_schedule(db: Session, schedule_id: int) -> None:
        schedule = GymService.get_schedule_by_id(db, schedule_id)
        db.delete(schedule)
        db.commit()
