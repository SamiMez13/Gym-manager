# Gym-Manager

A modern, full-stack Fitness Studio & Gym Management platform built with **FastAPI (Python)** and **Angular + Ionic**.

---

## 📁 Project Architecture

The codebase is organized into decoupled **`backend/`** and **`frontend/`** directories:

```
Gym-Manager/
├── backend/                  # FastAPI Application (Clean Architecture)
│   ├── app/
│   │   ├── core/             # Configuration & Database Session
│   │   │   ├── config.py     # App settings, CORS, Database URL
│   │   │   └── database.py   # SQLAlchemy Engine & Session provider
│   │   ├── models/           # SQLAlchemy ORM Models
│   │   │   ├── branch.py     # Gym facilities & locations
│   │   │   ├── trainer.py    # Trainers & instructors
│   │   │   ├── member.py     # Gym members
│   │   │   ├── gym_class.py  # Class types (HIIT, Yoga, etc.)
│   │   │   ├── schedule.py   # Class schedules & time slots
│   │   │   ├── booking.py    # Member bookings
│   │   │   ├── membership.py # Membership plans & subscriptions
│   │   │   └── payment.py    # Payments & invoices
│   │   ├── schemas/          # Pydantic Schemas (CamelCase serialized for Angular)
│   │   ├── services/         # Dedicated Business Logic Layer
│   │   │   ├── gym_service.py       # Branch, Trainer, Class, Schedule logic
│   │   │   ├── booking_service.py   # Atomic capacity validation & bookings
│   │   │   ├── member_service.py    # Member & plan operations
│   │   │   ├── payment_service.py   # Payments & invoicing
│   │   │   └── dashboard_service.py # Stats, revenue, & utilization metrics
│   │   ├── routers/          # Thin API Controllers
│   │   │   ├── dashboard.py  # /api/dashboard/*
│   │   │   ├── seed.py       # /api/seed (Data initialization)
│   │   │   └── resources.py  # Universal /api/{resource} endpoints
│   │   └── seed_data.py      # Automated initial data generator
│   ├── main.py               # Entry point (auto-creates tables and seeds)
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # Angular + Ionic Client
│   ├── src/
│   │   ├── app/
│   │   │   ├── api.service.ts # Centralized HTTP client for backend
│   │   │   └── ...            # Components & wireframes
│   │   └── styles.scss
│   ├── angular.json          # Angular CLI configuration
│   ├── proxy.conf.json       # Dev proxy pointing /api -> localhost:8000
│   └── package.json
│
└── README.md
```

---

## ⚡ Getting Started

### 1. Run the Backend

```powershell
cd backend
python -m pip install -r requirements.txt
python main.py
```
- **API Server**: http://localhost:8000
- **Interactive Swagger Docs**: http://localhost:8000/docs
- **Database**: Automatically uses SQLite (`gym.db`) for instant local development, or PostgreSQL when `DATABASE_URL` is configured in your environment. Tables and sample data are automatically initialized on first run.

### 2. Run the Frontend

```powershell
cd frontend
npm install
npm start
```
- **Web App**: http://localhost:4200 (proxies `/api` calls to the backend on `localhost:8000`).

---

## 🛡️ Key Architectural Highlights

1. **Clean Service Layer**: Business logic (such as checking class capacity before booking, enforcing active member status, and calculating revenue metrics) is completely isolated from HTTP routes.
2. **Concurrency-Safe Bookings**: `BookingService` performs atomic capacity and duplicate-booking checks before inserting reservations.
3. **Database Flexibility**: Supports standard SQLite out of the box with zero setup, with instant drop-in PostgreSQL support via `DATABASE_URL`.
4. **Seamless CamelCase Serialization**: Pydantic models automatically serialize to camelCase for the Angular frontend (`firstName`, `maxCapacity`, `startDate`, etc.) while maintaining pythonic snake_case internally.
