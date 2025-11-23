import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # CORS settings
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:8000").split(",")
    
    # Redis settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Application settings
    APP_NAME: str = "Smart Factory Simulator"
    APP_VERSION: str = "1.0.0"

settings = Settings()
