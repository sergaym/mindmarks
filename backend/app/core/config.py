from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    # General Config
    PROJECT_NAME: str = "mindmarks API"
    API_VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "YOUR_SECRET_KEY"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_API_KEY: str
    ASSISTANT_ID: str
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080"]

    # Database Configurations
    DB_USERNAME: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: str
    DB_DATABASE: str
    DB_SSLMODE: Optional[str] = "require"

    @property
    def DATABASE_URL(self) -> str:
        if self.DB_SSLMODE:
            return f"postgresql://{self.DB_USERNAME}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_DATABASE}?sslmode={self.DB_SSLMODE}"
        else:
            return f"postgresql://{self.DB_USERNAME}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_DATABASE}"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

    def get_settings(self):
        return self

    @property
    def fastapi_kwargs(self):
        return {
            "title": self.PROJECT_NAME,
            "version": self.API_VERSION,
            "openapi_url": f"{self.API_V1_STR}/openapi.json",
            "docs_url": None,
            "redoc_url": None,
        }

    @property
    def get_rate_limiter(self):
        return "30/minute"


# Create an instance of the Settings class
settings_instance = Settings()

# Directly use the instance without caching
settings = settings_instance
