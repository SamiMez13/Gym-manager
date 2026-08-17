from __future__ import annotations

import os
from datetime import datetime, date
from decimal import Decimal
from typing import Any

import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Gym Hub API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def connection():
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is required")
    return psycopg2.connect(url)


def clean(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, dict):
        return {camel_key(k): clean(v) for k, v in value.items()}
    if isinstance(value, list):
        return [clean(v) for v in value]
    return value


def camel_key(key: str) -> str:
    parts = key.split("_")
    return parts[0] + "".join(p.title() for p in parts[1:])


def run(sql: str, params: tuple[Any, ...] = (), fetch: bool = True, many: bool = False):
    try:
        with connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, params)
                rows = cur.fetchall() if fetch and cur.description else []
                return [clean(dict(row)) for row in rows]
    except psycopg2.Error as exc:
        raise HTTPException(status_code=400, detail=str(exc).split("\n")[0])


def one(sql: str, params: tuple[Any, ...] = ()):
    rows = run(sql, params)
    if not rows:
        raise HTTPException(status_code=404, detail="Record not found")
    return rows[0]


TABLES = {
    "branches": ("branches", ["name", "address", "phone", "email", "capacity", "is_active"]),
    "trainers": ("trainers", ["first_name", "last_name", "email", "phone", "specialization", "bio", "branch_id", "is_active"]),
    "members": ("members", ["first_name", "last_name", "email", "phone", "date_of_birth", "address", "emergency_contact", "is_active"]),
    "classes": ("gym_classes", ["name", "category", "description", "duration_minutes", "max_capacity", "difficulty_level", "is_active"]),
    "schedules": ("class_schedules", ["class_id", "trainer_id", "branch_id", "start_time", "end_time", "status", "notes"]),
    "bookings": ("bookings", ["member_id", "schedule_id", "status", "notes"]),
    "membership-plans": ("membership_plans", ["name", "description", "duration_days", "price", "max_classes_per_month", "is_active"]),
    "memberships": ("memberships", ["member_id", "plan_id", "start_date", "end_date", "status"]),
    "payments": ("payments", ["member_id", "membership_id", "amount", "type", "status", "method", "notes"]),
}


def payload_columns(payload: dict[str, Any], allowed: list[str]) -> tuple[list[str], list[Any]]:
    snake = {}
    for key, value in payload.items():
        converted = ""
        for char in key:
            converted += "_" + char.lower() if char.isupper() else char
        snake[converted] = value
    columns = [key for key in allowed if key in snake]
    return columns, [snake[key] for key in columns]


def list_records(resource: str):
    table, _ = TABLES[resource]
    if resource == "branches":
        return run("SELECT * FROM branches ORDER BY id")
    if resource == "trainers":
        return run("""SELECT t.*, b.name AS branch_name FROM trainers t
                      LEFT JOIN branches b ON b.id=t.branch_id ORDER BY t.id""")
    if resource == "members":
        return run("SELECT * FROM members ORDER BY id")
    if resource == "classes":
        return run("SELECT * FROM gym_classes ORDER BY id")
    if resource == "schedules":
        return run("""SELECT s.*, c.name AS class_name, c.max_capacity,
                      t.first_name || ' ' || t.last_name AS trainer_name,
                      b.name AS branch_name,
                      (SELECT count(*) FROM bookings bk WHERE bk.schedule_id=s.id AND bk.status NOT IN ('cancelled','no-show')) AS current_bookings
                      FROM class_schedules s
                      JOIN gym_classes c ON c.id=s.class_id
                      JOIN trainers t ON t.id=s.trainer_id
                      JOIN branches b ON b.id=s.branch_id
                      ORDER BY s.start_time""")
    if resource == "bookings":
        return run("""SELECT bk.*, m.first_name || ' ' || m.last_name AS member_name,
                      c.name AS class_name, s.start_time, s.end_time
                      FROM bookings bk
                      JOIN members m ON m.id=bk.member_id
                      JOIN class_schedules s ON s.id=bk.schedule_id
                      JOIN gym_classes c ON c.id=s.class_id
                      ORDER BY bk.created_at DESC""")
    if resource == "membership-plans":
        return run("SELECT * FROM membership_plans ORDER BY id")
    if resource == "memberships":
        return run("""SELECT ms.*, m.first_name || ' ' || m.last_name AS member_name,
                      p.name AS plan_name, p.price
                      FROM memberships ms
                      JOIN members m ON m.id=ms.member_id
                      JOIN membership_plans p ON p.id=ms.plan_id
                      ORDER BY ms.end_date DESC""")
    if resource == "payments":
        return run("""SELECT p.*, m.first_name || ' ' || m.last_name AS member_name
                      FROM payments p JOIN members m ON m.id=p.member_id
                      ORDER BY p.created_at DESC""")
    return run(f"SELECT * FROM {table} ORDER BY id")


@app.get("/api/healthz")
def health():
    return {"status": "ok"}


@app.get("/api/dashboard/stats")
def dashboard_stats():
    return one("""SELECT
      coalesce((SELECT sum(amount) FROM payments WHERE status='completed'),0) AS total_revenue,
      (SELECT count(*) FROM members WHERE is_active=true) AS active_members,
      (SELECT count(*) FROM class_schedules WHERE start_time::date=current_date AND status='scheduled') AS todays_classes,
      (SELECT count(*) FROM memberships WHERE status='active') AS active_memberships,
      (SELECT count(*) FROM branches WHERE is_active=true) AS branch_count,
      (SELECT count(*) FROM members) AS total_members""")


@app.get("/api/dashboard/revenue-summary")
def revenue_summary():
    return run("""SELECT to_char(date_trunc('month', created_at),'YYYY-MM') AS month,
                  coalesce(sum(amount),0) AS revenue
                  FROM payments WHERE status='completed'
                  GROUP BY 1 ORDER BY 1 DESC LIMIT 6""")


@app.get("/api/dashboard/class-utilization")
def class_utilization():
    return run("""SELECT c.name AS class_name, c.max_capacity,
                  coalesce(avg(x.bookings),0) AS bookings,
                  round(coalesce(avg(x.bookings) / nullif(c.max_capacity,0) * 100,0), 1) AS utilization
                  FROM gym_classes c
                  LEFT JOIN class_schedules s ON s.class_id=c.id
                  LEFT JOIN (SELECT schedule_id, count(*)::numeric AS bookings FROM bookings
                             WHERE status NOT IN ('cancelled','no-show') GROUP BY schedule_id) x ON x.schedule_id=s.id
                  GROUP BY c.id ORDER BY c.name""")


@app.get("/api/dashboard/recent-activity")
def recent_activity():
    return run("""SELECT 'payment' AS type, p.created_at AS occurred_at,
                  m.first_name || ' ' || m.last_name AS title,
                  'Payment of $' || p.amount AS description
                  FROM payments p JOIN members m ON m.id=p.member_id
                  UNION ALL
                  SELECT 'booking', bk.created_at, m.first_name || ' ' || m.last_name,
                  'Booked ' || c.name
                  FROM bookings bk JOIN members m ON m.id=bk.member_id
                  JOIN class_schedules s ON s.id=bk.schedule_id JOIN gym_classes c ON c.id=s.class_id
                  ORDER BY occurred_at DESC LIMIT 10""")


@app.get("/api/{resource}")
def get_many(resource: str):
    if resource not in TABLES:
        raise HTTPException(404, "Unknown resource")
    return list_records(resource)


@app.post("/api/{resource}", status_code=201)
async def create(resource: str, request: Request):
    if resource not in TABLES:
        raise HTTPException(404, "Unknown resource")
    table, allowed = TABLES[resource]
    body = await request.json()
    columns, values = payload_columns(body, allowed)
    if not columns:
        raise HTTPException(422, "At least one field is required")
    quoted = ", ".join(columns)
    placeholders = ", ".join(["%s"] * len(values))
    return one(f"INSERT INTO {table} ({quoted}) VALUES ({placeholders}) RETURNING *", tuple(values))


@app.get("/api/{resource}/{record_id}")
def get_one(resource: str, record_id: int):
    if resource not in TABLES:
        raise HTTPException(404, "Unknown resource")
    table, _ = TABLES[resource]
    return one(f"SELECT * FROM {table} WHERE id=%s", (record_id,))


@app.patch("/api/{resource}/{record_id}")
async def update(resource: str, record_id: int, request: Request):
    if resource not in TABLES:
        raise HTTPException(404, "Unknown resource")
    table, allowed = TABLES[resource]
    body = await request.json()
    columns, values = payload_columns(body, allowed)
    if not columns:
        return get_one(resource, record_id)
    assignments = ", ".join(f"{column}=%s" for column in columns)
    return one(f"UPDATE {table} SET {assignments} WHERE id=%s RETURNING *", tuple(values) + (record_id,))


@app.delete("/api/{resource}/{record_id}", status_code=204)
def delete(resource: str, record_id: int):
    if resource not in TABLES:
        raise HTTPException(404, "Unknown resource")
    table, _ = TABLES[resource]
    run(f"DELETE FROM {table} WHERE id=%s", (record_id,), fetch=False)
    return None