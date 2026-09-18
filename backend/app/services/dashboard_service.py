from datetime import datetime, date
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.payment import Payment
from app.models.member import Member
from app.models.membership import Membership
from app.models.branch import Branch
from app.models.gym_class import GymClass
from app.models.schedule import Schedule
from app.models.booking import Booking

class DashboardService:
    @staticmethod
    def get_stats(db: Session) -> Dict[str, Any]:
        # 1. Total revenue from completed payments
        total_rev = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(Payment.status == "completed")
            .scalar() or 0
        )

        # 2. Active members
        active_members = db.query(func.count(Member.id)).filter(Member.is_active == True).scalar() or 0

        # 3. Today's scheduled classes
        today = date.today()
        todays_classes = (
            db.query(func.count(Schedule.id))
            .filter(
                func.date(Schedule.start_time) == today,
                Schedule.status == "scheduled",
            )
            .scalar() or 0
        )

        # 4. Active memberships
        active_memberships = (
            db.query(func.count(Membership.id))
            .filter(Membership.status == "active")
            .scalar() or 0
        )

        # 5. Branch count
        branch_count = db.query(func.count(Branch.id)).filter(Branch.is_active == True).scalar() or 0

        # 6. Total members
        total_members = db.query(func.count(Member.id)).scalar() or 0

        return {
            "total_revenue": float(total_rev),
            "active_members": active_members,
            "todays_classes": todays_classes,
            "active_memberships": active_memberships,
            "branch_count": branch_count,
            "total_members": total_members,
        }

    @staticmethod
    def get_revenue_summary(db: Session) -> List[Dict[str, Any]]:
        # Compute monthly revenue for the last 6 months
        payments = (
            db.query(Payment)
            .filter(Payment.status == "completed")
            .order_by(Payment.created_at.desc())
            .all()
        )
        monthly_map: Dict[str, float] = {}
        for p in payments:
            if p.created_at:
                month_key = p.created_at.strftime("%Y-%m")
                monthly_map[month_key] = monthly_map.get(month_key, 0.0) + float(p.amount)

        # Sort descending, limit to 6
        sorted_months = sorted(monthly_map.items(), key=lambda x: x[0], reverse=True)[:6]
        return [{"month": m, "revenue": rev} for m, rev in sorted_months]

    @staticmethod
    def get_class_utilization(db: Session) -> List[Dict[str, Any]]:
        classes = db.query(GymClass).order_by(GymClass.name).all()
        result = []
        for c in classes:
            # Average bookings per schedule for this class
            schedules = db.query(Schedule).filter(Schedule.class_id == c.id).all()
            if not schedules:
                result.append({
                    "class_name": c.name,
                    "max_capacity": c.max_capacity,
                    "bookings": 0.0,
                    "utilization": 0.0,
                })
                continue

            total_bookings = 0
            for s in schedules:
                b_count = (
                    db.query(func.count(Booking.id))
                    .filter(Booking.schedule_id == s.id, Booking.status.notin_(["cancelled", "no-show"]))
                    .scalar() or 0
                )
                total_bookings += b_count

            avg_bookings = round(total_bookings / len(schedules), 1)
            utilization = round((avg_bookings / c.max_capacity * 100) if c.max_capacity else 0.0, 1)

            result.append({
                "class_name": c.name,
                "max_capacity": c.max_capacity,
                "bookings": avg_bookings,
                "utilization": utilization,
            })
        return result

    @staticmethod
    def get_recent_activity(db: Session) -> List[Dict[str, Any]]:
        activities: List[Dict[str, Any]] = []

        # Recent payments
        payments = db.query(Payment).order_by(Payment.created_at.desc()).limit(10).all()
        for p in payments:
            member_name = p.member.full_name if p.member else "Unknown Member"
            activities.append({
                "type": "payment",
                "occurred_at": p.created_at,
                "title": member_name,
                "description": f"Payment of ${float(p.amount):,.2f}",
            })

        # Recent bookings
        bookings = db.query(Booking).order_by(Booking.created_at.desc()).limit(10).all()
        for b in bookings:
            member_name = b.member.full_name if b.member else "Unknown Member"
            class_name = b.schedule.gym_class.name if b.schedule and b.schedule.gym_class else "Class"
            activities.append({
                "type": "booking",
                "occurred_at": b.created_at,
                "title": member_name,
                "description": f"Booked {class_name}",
            })

        # Sort combined activities by occurred_at desc
        activities.sort(key=lambda x: x["occurred_at"] or datetime.min, reverse=True)
        return activities[:10]
