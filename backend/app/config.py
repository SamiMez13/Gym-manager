from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    PROJECT_NAME: str = "Gym Hub API"
    VERSION: str = "2.1.0"
    API_V1_STR: str = "/api"
    CORS_ORIGINS: List[str] = ["*"]

    database_hostname: str
    database_port: str
    database_password: str
    database_name: str
    database_username: str

    model_config = SettingsConfigDict(
        env_file=(str(_ENV_FILE), ".env"),
        extra="ignore"
    )

    @classmethod
    def strip_trailing_slash(cls, v: str) -> str:
        return v.rstrip("/")


settings = Settings()
