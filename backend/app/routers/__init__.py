from app.routers.dashboard import router as dashboard_router
from app.routers.seed import router as seed_router
from app.routers.resources import router as resources_router

__all__ = [
    "dashboard_router",
    "seed_router",
    "resources_router",
]
