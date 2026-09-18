import os
from typing import List

class Settings:
    PROJECT_NAME: str = "Gym Hub API"
    VERSION: str = "2.1.0"
    API_V1_STR: str = "/api"
    
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///./gym.db")
    
    # In SQLite, postgresql:// URLs need pg8000 or psycopg2.
    # Fallback gracefully if DATABASE_URL is not set or SQLite is desired.
    @property
    def sync_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    CORS_ORIGINS: List[str] = ["*"]

settings = Settings()
