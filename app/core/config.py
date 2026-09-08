from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "KPU Local Operations API"
    DATABASE_URL: str
    OLLAMA_HOST: str
    SECRET_KEY: str

    class Config:
        env_file = (".env", "app/.env")
        extra = "ignore"

settings = Settings()
