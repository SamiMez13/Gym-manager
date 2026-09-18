from typing import List, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.payment import Payment
from app.schemas.payment import PaymentCreate, PaymentUpdate

class PaymentService:
    @staticmethod
    def get_payments(db: Session) -> List[Dict[str, Any]]:
        payments = db.query(Payment).order_by(Payment.created_at.desc()).all()
        result = []
        for p in payments:
            result.append({
                "id": p.id,
                "member_id": p.member_id,
                "membership_id": p.membership_id,
                "amount": float(p.amount),
                "type": p.type,
                "status": p.status,
                "method": p.method,
                "notes": p.notes,
                "created_at": p.created_at,
                "member_name": p.member.full_name if p.member else None,
            })
        return result

    @staticmethod
    def get_payment_by_id(db: Session, payment_id: int) -> Payment:
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        return payment

    @staticmethod
    def create_payment(db: Session, data: PaymentCreate) -> Payment:
        payment = Payment(**data.model_dump())
        db.add(payment)
        db.commit()
        db.refresh(payment)
        return payment

    @staticmethod
    def update_payment(db: Session, payment_id: int, data: PaymentUpdate) -> Payment:
        payment = PaymentService.get_payment_by_id(db, payment_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(payment, key, value)
        db.commit()
        db.refresh(payment)
        return payment

    @staticmethod
    def delete_payment(db: Session, payment_id: int) -> None:
        payment = PaymentService.get_payment_by_id(db, payment_id)
        db.delete(payment)
        db.commit()
