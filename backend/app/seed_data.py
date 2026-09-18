from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from app.models.branch import Branch
from app.models.trainer import Trainer
from app.models.member import Member
from app.models.gym_class import GymClass
from app.models.schedule import Schedule
from app.models.booking import Booking
from app.models.membership import MembershipPlan, Membership
from app.models.payment import Payment

def seed_database(db: Session, force: bool = False):
    # Check if database already has data
    if not force and db.query(Branch).first() is not None:
        return {"status": "skipped", "message": "Database already contains data"}

    # 1. Seed Branches
    b1 = Branch(name="Downtown Elite", address="100 Main St, Metropolis", phone="555-0101", email="downtown@gymhub.com", capacity=150, is_active=True)
    b2 = Branch(name="Westside Fitness", address="450 Ocean Ave, Metropolis", phone="555-0102", email="westside@gymhub.com", capacity=120, is_active=True)
    b3 = Branch(name="North Hills Club", address="780 Hillcrest Rd, Metropolis", phone="555-0103", email="northhills@gymhub.com", capacity=90, is_active=True)
    db.add_all([b1, b2, b3])
    db.flush()

    # 2. Seed Trainers
    t1 = Trainer(first_name="Marcus", last_name="Vance", email="marcus@gymhub.com", phone="555-0201", specialization="Strength & Conditioning, CrossFit", bio="Former collegiate athlete with 8+ years coaching experience.", branch_id=b1.id, is_active=True)
    t2 = Trainer(first_name="Elena", last_name="Rostova", email="elena@gymhub.com", phone="555-0202", specialization="Vinyasa Yoga, Pilates Core", bio="Certified 500-hour RYT focusing on mindful movement and flexibility.", branch_id=b1.id, is_active=True)
    t3 = Trainer(first_name="David", last_name="Chen", email="david@gymhub.com", phone="555-0203", specialization="HIIT, Boxing & Kickboxing", bio="Golden Gloves contender specializing in cardiovascular endurance.", branch_id=b2.id, is_active=True)
    t4 = Trainer(first_name="Sarah", last_name="Jenkins", email="sarah@gymhub.com", phone="555-0204", specialization="Spinning, Functional Fitness", bio="High-energy group cycling instructor with rhythmic training philosophy.", branch_id=b3.id, is_active=True)
    db.add_all([t1, t2, t3, t4])
    db.flush()

    # 3. Seed Membership Plans
    p1 = MembershipPlan(name="Basic Fitness", description="Access to gym equipment during standard hours", duration_days=30, price=49.99, max_classes_per_month=4, is_active=True)
    p2 = MembershipPlan(name="Pro Athlete", description="Full access to all gym locations and up to 15 group classes", duration_days=30, price=89.99, max_classes_per_month=15, is_active=True)
    p3 = MembershipPlan(name="VIP Unlimited", description="Unlimited access, all classes, towel service, and guest privileges", duration_days=30, price=129.99, max_classes_per_month=999, is_active=True)
    db.add_all([p1, p2, p3])
    db.flush()

    # 4. Seed Members
    m1 = Member(first_name="Alexander", last_name="Wright", email="alex.wright@example.com", phone="555-0301", date_of_birth=date(1992, 4, 15), address="12 Elm St", is_active=True)
    m2 = Member(first_name="Sophia", last_name="Martinez", email="sophia.m@example.com", phone="555-0302", date_of_birth=date(1996, 9, 21), address="48 Pine St", is_active=True)
    m3 = Member(first_name="Liam", last_name="Johnson", email="liam.j@example.com", phone="555-0303", date_of_birth=date(1988, 11, 3), address="77 Maple Ave", is_active=True)
    m4 = Member(first_name="Emma", last_name="Davis", email="emma.davis@example.com", phone="555-0304", date_of_birth=date(1994, 2, 18), address="105 Cedar Lane", is_active=True)
    m5 = Member(first_name="Noah", last_name="Wilson", email="noah.w@example.com", phone="555-0305", date_of_birth=date(1990, 7, 30), address="220 Oak Blvd", is_active=True)
    db.add_all([m1, m2, m3, m4, m5])
    db.flush()

    # 5. Seed Memberships & Payments
    today = date.today()
    ms1 = Membership(member_id=m1.id, plan_id=p3.id, start_date=today - timedelta(days=15), end_date=today + timedelta(days=15), status="active")
    ms2 = Membership(member_id=m2.id, plan_id=p2.id, start_date=today - timedelta(days=10), end_date=today + timedelta(days=20), status="active")
    ms3 = Membership(member_id=m3.id, plan_id=p1.id, start_date=today - timedelta(days=5), end_date=today + timedelta(days=25), status="active")
    ms4 = Membership(member_id=m4.id, plan_id=p3.id, start_date=today - timedelta(days=20), end_date=today + timedelta(days=10), status="active")
    db.add_all([ms1, ms2, ms3, ms4])
    db.flush()

    pay1 = Payment(member_id=m1.id, membership_id=ms1.id, amount=129.99, type="membership", status="completed", method="credit_card")
    pay2 = Payment(member_id=m2.id, membership_id=ms2.id, amount=89.99, type="membership", status="completed", method="credit_card")
    pay3 = Payment(member_id=m3.id, membership_id=ms3.id, amount=49.99, type="membership", status="completed", method="bank_transfer")
    pay4 = Payment(member_id=m4.id, membership_id=ms4.id, amount=129.99, type="membership", status="completed", method="credit_card")
    db.add_all([pay1, pay2, pay3, pay4])
    db.flush()

    # 6. Seed Gym Classes
    c1 = GymClass(name="Power HIIT 45", category="Cardio", description="High-intensity intervals for maximum calorie burn and cardiovascular performance.", duration_minutes=45, max_capacity=16, difficulty_level="Intermediate", is_active=True)
    c2 = GymClass(name="Sunrise Vinyasa Flow", category="Yoga", description="Harmonize breath with movement to develop strength, mobility, and core control.", duration_minutes=60, max_capacity=20, difficulty_level="All Levels", is_active=True)
    c3 = GymClass(name="Olympic Barbell & Strength", category="Strength", description="Master power movements, squats, deadlifts, and functional strength protocols.", duration_minutes=60, max_capacity=12, difficulty_level="Advanced", is_active=True)
    c4 = GymClass(name="Rhythm Spin Cycling", category="Spinning", description="Cardio cycle workout driven by curated playlists and resistance sprints.", duration_minutes=50, max_capacity=24, difficulty_level="All Levels", is_active=True)
    db.add_all([c1, c2, c3, c4])
    db.flush()

    # 7. Seed Class Schedules (Today and upcoming)
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day, 9, 0)

    s1 = Schedule(class_id=c1.id, trainer_id=t3.id, branch_id=b2.id, start_time=today_start + timedelta(hours=1), end_time=today_start + timedelta(hours=2), status="scheduled", notes="Bring indoor training shoes and water bottle.")
    s2 = Schedule(class_id=c2.id, trainer_id=t2.id, branch_id=b1.id, start_time=today_start + timedelta(hours=3), end_time=today_start + timedelta(hours=4), status="scheduled", notes="Yoga mats and blocks provided on-site.")
    s3 = Schedule(class_id=c3.id, trainer_id=t1.id, branch_id=b1.id, start_time=today_start + timedelta(hours=8), end_time=today_start + timedelta(hours=9), status="scheduled", notes="Please warm up shoulders and hips 10 mins prior.")
    s4 = Schedule(class_id=c4.id, trainer_id=t4.id, branch_id=b3.id, start_time=today_start + timedelta(days=1, hours=2), end_time=today_start + timedelta(days=1, hours=3), status="scheduled", notes="Clip-in shoes available at reception.")
    db.add_all([s1, s2, s3, s4])
    db.flush()

    # 8. Seed Bookings
    bk1 = Booking(member_id=m1.id, schedule_id=s1.id, status="confirmed", notes="First time taking HIIT with David")
    bk2 = Booking(member_id=m2.id, schedule_id=s1.id, status="confirmed")
    bk3 = Booking(member_id=m4.id, schedule_id=s2.id, status="confirmed")
    bk4 = Booking(member_id=m1.id, schedule_id=s3.id, status="confirmed")
    db.add_all([bk1, bk2, bk3, bk4])

    db.commit()
    return {"status": "success", "message": "Database seeded successfully with initial data"}
