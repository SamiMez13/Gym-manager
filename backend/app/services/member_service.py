from typing import List, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.member import Member
from app.models.membership import MembershipPlan, Membership
from app.schemas.member import MemberCreate, MemberUpdate
from app.schemas.membership import (
    MembershipPlanCreate,
    MembershipPlanUpdate,
    MembershipCreate,
    MembershipUpdate,
)

class MemberService:
    # --- Members ---
    @staticmethod
    def get_members(db: Session) -> List[Member]:
        return db.query(Member).order_by(Member.id).all()

    @staticmethod
    def get_member_by_id(db: Session, member_id: int) -> Member:
        member = db.query(Member).filter(Member.id == member_id).first()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        return member

    @staticmethod
    def create_member(db: Session, data: MemberCreate) -> Member:
        member = Member(**data.model_dump())
        db.add(member)
        db.commit()
        db.refresh(member)
        return member

    @staticmethod
    def update_member(db: Session, member_id: int, data: MemberUpdate) -> Member:
        member = MemberService.get_member_by_id(db, member_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(member, key, value)
        db.commit()
        db.refresh(member)
        return member

    @staticmethod
    def delete_member(db: Session, member_id: int) -> None:
        member = MemberService.get_member_by_id(db, member_id)
        db.delete(member)
        db.commit()

    # --- Membership Plans ---
    @staticmethod
    def get_plans(db: Session) -> List[MembershipPlan]:
        return db.query(MembershipPlan).order_by(MembershipPlan.id).all()

    @staticmethod
    def get_plan_by_id(db: Session, plan_id: int) -> MembershipPlan:
        plan = db.query(MembershipPlan).filter(MembershipPlan.id == plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Membership plan not found")
        return plan

    @staticmethod
    def create_plan(db: Session, data: MembershipPlanCreate) -> MembershipPlan:
        plan = MembershipPlan(**data.model_dump())
        db.add(plan)
        db.commit()
        db.refresh(plan)
        return plan

    @staticmethod
    def update_plan(db: Session, plan_id: int, data: MembershipPlanUpdate) -> MembershipPlan:
        plan = MemberService.get_plan_by_id(db, plan_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(plan, key, value)
        db.commit()
        db.refresh(plan)
        return plan

    @staticmethod
    def delete_plan(db: Session, plan_id: int) -> None:
        plan = MemberService.get_plan_by_id(db, plan_id)
        db.delete(plan)
        db.commit()

    # --- Active Memberships ---
    @staticmethod
    def get_memberships(db: Session) -> List[Dict[str, Any]]:
        memberships = db.query(Membership).order_by(Membership.end_date.desc()).all()
        result = []
        for ms in memberships:
            result.append({
                "id": ms.id,
                "member_id": ms.member_id,
                "plan_id": ms.plan_id,
                "start_date": ms.start_date,
                "end_date": ms.end_date,
                "status": ms.status,
                "member_name": ms.member.full_name if ms.member else None,
                "plan_name": ms.plan.name if ms.plan else None,
                "price": float(ms.plan.price) if ms.plan else None,
            })
        return result

    @staticmethod
    def get_membership_by_id(db: Session, membership_id: int) -> Membership:
        ms = db.query(Membership).filter(Membership.id == membership_id).first()
        if not ms:
            raise HTTPException(status_code=404, detail="Membership not found")
        return ms

    @staticmethod
    def create_membership(db: Session, data: MembershipCreate) -> Membership:
        ms = Membership(**data.model_dump())
        db.add(ms)
        db.commit()
        db.refresh(ms)
        return ms

    @staticmethod
    def update_membership(db: Session, membership_id: int, data: MembershipUpdate) -> Membership:
        ms = MemberService.get_membership_by_id(db, membership_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(ms, key, value)
        db.commit()
        db.refresh(ms)
        return ms

    @staticmethod
    def delete_membership(db: Session, membership_id: int) -> None:
        ms = MemberService.get_membership_by_id(db, membership_id)
        db.delete(ms)
        db.commit()
