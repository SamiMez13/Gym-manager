from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.gym_service import GymService
from app.services.member_service import MemberService
from app.services.booking_service import BookingService
from app.services.payment_service import PaymentService
from app.schemas.common import to_camel_dict

from app.schemas.branch import BranchCreate, BranchUpdate
from app.schemas.trainer import TrainerCreate, TrainerUpdate
from app.schemas.gym_class import GymClassCreate, GymClassUpdate
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate
from app.schemas.booking import BookingCreate, BookingUpdate
from app.schemas.member import MemberCreate, MemberUpdate
from app.schemas.membership import (
    MembershipPlanCreate,
    MembershipPlanUpdate,
    MembershipCreate,
    MembershipUpdate,
)
from app.schemas.payment import PaymentCreate, PaymentUpdate

router = APIRouter(tags=["Resources"])

# Helper to normalize incoming camelCase / snake_case request body
def normalize_body(body: Dict[str, Any]) -> Dict[str, Any]:
    normalized = {}
    for k, v in body.items():
        snake_k = ""
        for char in k:
            snake_k += "_" + char.lower() if char.isupper() else char
        normalized[snake_k] = v
    return normalized

# Universal resource router matching frontend ApiService
VALID_RESOURCES = {
    "branches",
    "trainers",
    "members",
    "classes",
    "schedules",
    "bookings",
    "membership-plans",
    "memberships",
    "payments",
}

@router.get("/{resource}")
def list_resource(resource: str, db: Session = Depends(get_db)):
    if resource not in VALID_RESOURCES:
        raise HTTPException(status_code=404, detail=f"Unknown resource: {resource}")

    if resource == "branches":
        items = GymService.get_branches(db)
        return [to_camel_dict({
            "id": b.id, "name": b.name, "address": b.address, "phone": b.phone,
            "email": b.email, "capacity": b.capacity, "is_active": b.is_active
        }) for b in items]

    if resource == "trainers":
        return [to_camel_dict(t) for t in GymService.get_trainers(db)]

    if resource == "classes":
        items = GymService.get_classes(db)
        return [to_camel_dict({
            "id": c.id, "name": c.name, "category": c.category, "description": c.description,
            "duration_minutes": c.duration_minutes, "max_capacity": c.max_capacity,
            "difficulty_level": c.difficulty_level, "is_active": c.is_active
        }) for c in items]

    if resource == "schedules":
        return [to_camel_dict(s) for s in GymService.get_schedules(db)]

    if resource == "bookings":
        items = BookingService.get_bookings(db)
        res = []
        for bk in items:
            res.append(to_camel_dict({
                "id": bk.id,
                "member_id": bk.member_id,
                "schedule_id": bk.schedule_id,
                "status": bk.status,
                "notes": bk.notes,
                "created_at": bk.created_at,
                "member_name": bk.member.full_name if bk.member else None,
                "class_name": bk.schedule.gym_class.name if (bk.schedule and bk.schedule.gym_class) else None,
                "start_time": bk.schedule.start_time if bk.schedule else None,
                "end_time": bk.schedule.end_time if bk.schedule else None,
            }))
        return res

    if resource == "members":
        items = MemberService.get_members(db)
        return [to_camel_dict({
            "id": m.id, "first_name": m.first_name, "last_name": m.last_name,
            "email": m.email, "phone": m.phone, "date_of_birth": m.date_of_birth,
            "address": m.address, "emergency_contact": m.emergency_contact, "is_active": m.is_active
        }) for m in items]

    if resource == "membership-plans":
        items = MemberService.get_plans(db)
        return [to_camel_dict({
            "id": p.id, "name": p.name, "description": p.description,
            "duration_days": p.duration_days, "price": float(p.price),
            "max_classes_per_month": p.max_classes_per_month, "is_active": p.is_active
        }) for p in items]

    if resource == "memberships":
        return [to_camel_dict(ms) for ms in MemberService.get_memberships(db)]

    if resource == "payments":
        return [to_camel_dict(p) for p in PaymentService.get_payments(db)]


@router.post("/{resource}", status_code=status.HTTP_201_CREATED)
async def create_resource(resource: str, request: Request, db: Session = Depends(get_db)):
    if resource not in VALID_RESOURCES:
        raise HTTPException(status_code=404, detail=f"Unknown resource: {resource}")

    raw_body = await request.json()
    body = normalize_body(raw_body)

    if resource == "branches":
        obj = GymService.create_branch(db, BranchCreate(**body))
        return to_camel_dict({"id": obj.id, "name": obj.name, "address": obj.address, "phone": obj.phone, "email": obj.email, "capacity": obj.capacity, "is_active": obj.is_active})

    if resource == "trainers":
        obj = GymService.create_trainer(db, TrainerCreate(**body))
        return to_camel_dict({"id": obj.id, "first_name": obj.first_name, "last_name": obj.last_name, "email": obj.email, "phone": obj.phone, "specialization": obj.specialization, "bio": obj.bio, "branch_id": obj.branch_id, "is_active": obj.is_active})

    if resource == "classes":
        obj = GymService.create_class(db, GymClassCreate(**body))
        return to_camel_dict({"id": obj.id, "name": obj.name, "category": obj.category, "description": obj.description, "duration_minutes": obj.duration_minutes, "max_capacity": obj.max_capacity, "difficulty_level": obj.difficulty_level, "is_active": obj.is_active})

    if resource == "schedules":
        obj = GymService.create_schedule(db, ScheduleCreate(**body))
        return to_camel_dict({"id": obj.id, "class_id": obj.class_id, "trainer_id": obj.trainer_id, "branch_id": obj.branch_id, "start_time": obj.start_time, "end_time": obj.end_time, "status": obj.status, "notes": obj.notes})

    if resource == "bookings":
        obj = BookingService.create_booking(db, BookingCreate(**body))
        return to_camel_dict({
            "id": obj.id, "member_id": obj.member_id, "schedule_id": obj.schedule_id,
            "status": obj.status, "notes": obj.notes, "created_at": obj.created_at,
            "member_name": obj.member.full_name if obj.member else None,
            "class_name": obj.schedule.gym_class.name if (obj.schedule and obj.schedule.gym_class) else None,
        })

    if resource == "members":
        obj = MemberService.create_member(db, MemberCreate(**body))
        return to_camel_dict({"id": obj.id, "first_name": obj.first_name, "last_name": obj.last_name, "email": obj.email, "phone": obj.phone, "date_of_birth": obj.date_of_birth, "address": obj.address, "emergency_contact": obj.emergency_contact, "is_active": obj.is_active})

    if resource == "membership-plans":
        obj = MemberService.create_plan(db, MembershipPlanCreate(**body))
        return to_camel_dict({"id": obj.id, "name": obj.name, "description": obj.description, "duration_days": obj.duration_days, "price": float(obj.price), "max_classes_per_month": obj.max_classes_per_month, "is_active": obj.is_active})

    if resource == "memberships":
        obj = MemberService.create_membership(db, MembershipCreate(**body))
        return to_camel_dict({"id": obj.id, "member_id": obj.member_id, "plan_id": obj.plan_id, "start_date": obj.start_date, "end_date": obj.end_date, "status": obj.status})

    if resource == "payments":
        obj = PaymentService.create_payment(db, PaymentCreate(**body))
        return to_camel_dict({"id": obj.id, "member_id": obj.member_id, "membership_id": obj.membership_id, "amount": float(obj.amount), "type": obj.type, "status": obj.status, "method": obj.method, "notes": obj.notes, "created_at": obj.created_at})


@router.get("/{resource}/{record_id}")
def get_one_resource(resource: str, record_id: int, db: Session = Depends(get_db)):
    if resource not in VALID_RESOURCES:
        raise HTTPException(status_code=404, detail=f"Unknown resource: {resource}")

    if resource == "branches":
        b = GymService.get_branch_by_id(db, record_id)
        return to_camel_dict({"id": b.id, "name": b.name, "address": b.address, "phone": b.phone, "email": b.email, "capacity": b.capacity, "is_active": b.is_active})

    if resource == "trainers":
        t = GymService.get_trainer_by_id(db, record_id)
        return to_camel_dict({"id": t.id, "first_name": t.first_name, "last_name": t.last_name, "email": t.email, "phone": t.phone, "specialization": t.specialization, "bio": t.bio, "branch_id": t.branch_id, "is_active": t.is_active, "branch_name": t.branch.name if t.branch else None})

    if resource == "classes":
        c = GymService.get_class_by_id(db, record_id)
        return to_camel_dict({"id": c.id, "name": c.name, "category": c.category, "description": c.description, "duration_minutes": c.duration_minutes, "max_capacity": c.max_capacity, "difficulty_level": c.difficulty_level, "is_active": c.is_active})

    if resource == "schedules":
        s = GymService.get_schedule_by_id(db, record_id)
        return to_camel_dict({"id": s.id, "class_id": s.class_id, "trainer_id": s.trainer_id, "branch_id": s.branch_id, "start_time": s.start_time, "end_time": s.end_time, "status": s.status, "notes": s.notes, "class_name": s.gym_class.name if s.gym_class else None, "trainer_name": s.trainer.full_name if s.trainer else None, "branch_name": s.branch.name if s.branch else None})

    if resource == "bookings":
        bk = BookingService.get_booking_by_id(db, record_id)
        return to_camel_dict({"id": bk.id, "member_id": bk.member_id, "schedule_id": bk.schedule_id, "status": bk.status, "notes": bk.notes, "created_at": bk.created_at, "member_name": bk.member.full_name if bk.member else None, "class_name": bk.schedule.gym_class.name if (bk.schedule and bk.schedule.gym_class) else None})

    if resource == "members":
        m = MemberService.get_member_by_id(db, record_id)
        return to_camel_dict({"id": m.id, "first_name": m.first_name, "last_name": m.last_name, "email": m.email, "phone": m.phone, "date_of_birth": m.date_of_birth, "address": m.address, "emergency_contact": m.emergency_contact, "is_active": m.is_active})

    if resource == "membership-plans":
        p = MemberService.get_plan_by_id(db, record_id)
        return to_camel_dict({"id": p.id, "name": p.name, "description": p.description, "duration_days": p.duration_days, "price": float(p.price), "max_classes_per_month": p.max_classes_per_month, "is_active": p.is_active})

    if resource == "memberships":
        ms = MemberService.get_membership_by_id(db, record_id)
        return to_camel_dict({"id": ms.id, "member_id": ms.member_id, "plan_id": ms.plan_id, "start_date": ms.start_date, "end_date": ms.end_date, "status": ms.status, "member_name": ms.member.full_name if ms.member else None, "plan_name": ms.plan.name if ms.plan else None, "price": float(ms.plan.price) if ms.plan else None})

    if resource == "payments":
        p = PaymentService.get_payment_by_id(db, record_id)
        return to_camel_dict({"id": p.id, "member_id": p.member_id, "membership_id": p.membership_id, "amount": float(p.amount), "type": p.type, "status": p.status, "method": p.method, "notes": p.notes, "created_at": p.created_at, "member_name": p.member.full_name if p.member else None})


@router.patch("/{resource}/{record_id}")
async def update_resource(resource: str, record_id: int, request: Request, db: Session = Depends(get_db)):
    if resource not in VALID_RESOURCES:
        raise HTTPException(status_code=404, detail=f"Unknown resource: {resource}")

    raw_body = await request.json()
    body = normalize_body(raw_body)

    if resource == "branches":
        obj = GymService.update_branch(db, record_id, BranchUpdate(**body))
        return to_camel_dict({"id": obj.id, "name": obj.name, "address": obj.address, "phone": obj.phone, "email": obj.email, "capacity": obj.capacity, "is_active": obj.is_active})

    if resource == "trainers":
        obj = GymService.update_trainer(db, record_id, TrainerUpdate(**body))
        return to_camel_dict({"id": obj.id, "first_name": obj.first_name, "last_name": obj.last_name, "email": obj.email, "phone": obj.phone, "specialization": obj.specialization, "bio": obj.bio, "branch_id": obj.branch_id, "is_active": obj.is_active})

    if resource == "classes":
        obj = GymService.update_class(db, record_id, GymClassUpdate(**body))
        return to_camel_dict({"id": obj.id, "name": obj.name, "category": obj.category, "description": obj.description, "duration_minutes": obj.duration_minutes, "max_capacity": obj.max_capacity, "difficulty_level": obj.difficulty_level, "is_active": obj.is_active})

    if resource == "schedules":
        obj = GymService.update_schedule(db, record_id, ScheduleUpdate(**body))
        return to_camel_dict({"id": obj.id, "class_id": obj.class_id, "trainer_id": obj.trainer_id, "branch_id": obj.branch_id, "start_time": obj.start_time, "end_time": obj.end_time, "status": obj.status, "notes": obj.notes})

    if resource == "bookings":
        obj = BookingService.update_booking(db, record_id, BookingUpdate(**body))
        return to_camel_dict({"id": obj.id, "member_id": obj.member_id, "schedule_id": obj.schedule_id, "status": obj.status, "notes": obj.notes})

    if resource == "members":
        obj = MemberService.update_member(db, record_id, MemberUpdate(**body))
        return to_camel_dict({"id": obj.id, "first_name": obj.first_name, "last_name": obj.last_name, "email": obj.email, "phone": obj.phone, "date_of_birth": obj.date_of_birth, "address": obj.address, "emergency_contact": obj.emergency_contact, "is_active": obj.is_active})

    if resource == "membership-plans":
        obj = MemberService.update_plan(db, record_id, MembershipPlanUpdate(**body))
        return to_camel_dict({"id": obj.id, "name": obj.name, "description": obj.description, "duration_days": obj.duration_days, "price": float(obj.price), "max_classes_per_month": obj.max_classes_per_month, "is_active": obj.is_active})

    if resource == "memberships":
        obj = MemberService.update_membership(db, record_id, MembershipUpdate(**body))
        return to_camel_dict({"id": obj.id, "member_id": obj.member_id, "plan_id": obj.plan_id, "start_date": obj.start_date, "end_date": obj.end_date, "status": obj.status})

    if resource == "payments":
        obj = PaymentService.update_payment(db, record_id, PaymentUpdate(**body))
        return to_camel_dict({"id": obj.id, "member_id": obj.member_id, "membership_id": obj.membership_id, "amount": float(obj.amount), "type": obj.type, "status": obj.status, "method": obj.method, "notes": obj.notes})


@router.delete("/{resource}/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(resource: str, record_id: int, db: Session = Depends(get_db)):
    if resource not in VALID_RESOURCES:
        raise HTTPException(status_code=404, detail=f"Unknown resource: {resource}")

    if resource == "branches":
        GymService.delete_branch(db, record_id)
    elif resource == "trainers":
        GymService.delete_trainer(db, record_id)
    elif resource == "classes":
        GymService.delete_class(db, record_id)
    elif resource == "schedules":
        GymService.delete_schedule(db, record_id)
    elif resource == "bookings":
        BookingService.delete_booking(db, record_id)
    elif resource == "members":
        MemberService.delete_member(db, record_id)
    elif resource == "membership-plans":
        MemberService.delete_plan(db, record_id)
    elif resource == "memberships":
        MemberService.delete_membership(db, record_id)
    elif resource == "payments":
        PaymentService.delete_payment(db, record_id)

    return Response(status_code=status.HTTP_204_NO_CONTENT)
