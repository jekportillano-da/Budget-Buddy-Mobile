"""
Production configuration for Budget Buddy Backend
Environment-specific settings for Railway deployment
"""

import os
from typing import Optional

# For Railway deployment, we'll use simple environment variable handling
class ProductionSettings:
    """Production environment settings"""
    
    # App Configuration
    app_name: str = "Budget Buddy Backend"
    version: str = "1.0.0"
    debug: bool = False
    environment: str = "production"
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = int(os.getenv("PORT", 8000))
    
    # Database Configuration (Railway PostgreSQL)
    database_url: str = os.getenv("DATABASE_URL", "")
    
    # Security Configuration
    secret_key: str = os.getenv("SECRET_KEY", "")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # API Keys (from Railway environment variables)
    cohere_api_key: str = os.getenv("COHERE_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    
    # CORS Configuration for React Native
    allowed_origins: list = [
        "https://budgetbuddy.app",  # Your production domain
        "https://www.budgetbuddy.app",
        "exp://localhost:8081",  # Expo development
        "http://localhost:3000",  # Web development
        "*"  # Allow all for React Native (can be restricted later)
    ]
    
    # Redis Configuration (optional, for caching)
    redis_url: Optional[str] = os.getenv("REDIS_URL")
    
    # Monitoring
    sentry_dsn: Optional[str] = os.getenv("SENTRY_DSN")
    
    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds
    
    class Config:
        env_file = ".env.production"
        case_sensitive = False

    def __init__(self):
        """Initialize settings from environment variables"""
        pass

# Global settings instance
settings = ProductionSettings()

# Railway-specific environment detection
def is_railway() -> bool:
    """Check if running on Railway platform"""
    return os.getenv("RAILWAY_ENVIRONMENT") is not None

def get_railway_url() -> str:
    """Get Railway deployment URL"""
    railway_url = os.getenv("RAILWAY_STATIC_URL")
    if railway_url:
        return f"https://{railway_url}"
    return "http://localhost:8000"

# Database URL helper for Railway
def get_database_url() -> str:
    """Get properly formatted database URL for Railway PostgreSQL"""
    if is_railway():
        # Railway provides DATABASE_URL
        db_url = os.getenv("DATABASE_URL")
        if db_url:
            # Convert postgres:// to postgresql:// if needed (SQLAlchemy requirement)
            if db_url.startswith("postgres://"):
                db_url = db_url.replace("postgres://", "postgresql://", 1)
            return db_url
    
    # Fallback for local development
    return "sqlite:///./budget_buddy_production.db"

# Export settings
__all__ = ["settings", "is_railway", "get_railway_url", "get_database_url"]