from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.booking import Booking
from app.models.schedule import Schedule
from app.models.member import Member
from app.models.gym_class import GymClass
from app.schemas.booking import BookingCreate, BookingUpdate

class BookingService:
    @staticmethod
    def get_bookings(db: Session, member_id: Optional[int] = None, schedule_id: Optional[int] = None) -> List[Booking]:
        query = db.query(Booking)
        if member_id:
            query = query.filter(Booking.member_id == member_id)
        if schedule_id:
            query = query.filter(Booking.schedule_id == schedule_id)
        return query.order_by(Booking.created_at.desc()).all()

    @staticmethod
    def get_booking_by_id(db: Session, booking_id: int) -> Booking:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        return booking

    @staticmethod
    def create_booking(db: Session, data: BookingCreate) -> Booking:
        # 1. Verify member exists and is active
        member = db.query(Member).filter(Member.id == data.member_id).first()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        if not member.is_active:
            raise HTTPException(status_code=400, detail="Cannot book class for inactive member")

        # 2. Verify schedule exists and fetch class capacity
        schedule = db.query(Schedule).filter(Schedule.id == data.schedule_id).first()
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")

        gym_class = db.query(GymClass).filter(GymClass.id == schedule.class_id).first()
        max_capacity = gym_class.max_capacity if gym_class else 20

        # 3. Check for existing active booking (prevent duplicate bookings)
        existing = (
            db.query(Booking)
            .filter(
                Booking.member_id == data.member_id,
                Booking.schedule_id == data.schedule_id,
                Booking.status.notin_(["cancelled", "no-show"]),
            )
            .first()
        )
        if existing:
            raise HTTPException(status_code=409, detail="Member already has an active booking for this session")

        # 4. Capacity validation (concurrency-safe)
        active_bookings_count = (
            db.query(func.count(Booking.id))
            .filter(
                Booking.schedule_id == data.schedule_id,
                Booking.status.notin_(["cancelled", "no-show"]),
            )
            .scalar() or 0
        )

        if active_bookings_count >= max_capacity:
            raise HTTPException(status_code=400, detail=f"This class has reached maximum capacity ({max_capacity} spots)")

        # 5. Create booking atomically
        booking = Booking(
            member_id=data.member_id,
            schedule_id=data.schedule_id,
            status=data.status or "confirmed",
            notes=data.notes,
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return booking

    @staticmethod
    def update_booking(db: Session, booking_id: int, data: BookingUpdate) -> Booking:
        booking = BookingService.get_booking_by_id(db, booking_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(booking, key, value)
        db.commit()
        db.refresh(booking)
        return booking

    @staticmethod
    def delete_booking(db: Session, booking_id: int) -> None:
        booking = BookingService.get_booking_by_id(db, booking_id)
        db.delete(booking)
        db.commit()
