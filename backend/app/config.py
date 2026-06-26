from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    redis_url: str = "redis://localhost:6379/0"
    gemini_api_key: str = ""
    gemini_model_name: str = "gemini-2.5-flash"
    secret_key: str = "dev-secret"
    environment: str = "development"
    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
