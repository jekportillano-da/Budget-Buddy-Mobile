"""
Budget Buddy Mobile - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from contextlib import asynccontextmanager
from decouple import config
import logging

from database import init_db, get_db_session
from auth.routes import router as auth_router
from ai.routes import router as ai_router
from users.routes import router as users_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database initialization
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Starting Budget Buddy Backend...")
    await init_db()
    logger.info("📊 Database initialized")
    yield
    # Shutdown
    logger.info("🛑 Shutting down Budget Buddy Backend...")

# Create FastAPI app
app = FastAPI(
    title="Budget Buddy Mobile API",
    description="Secure backend for Budget Buddy Mobile app with authentication and AI services",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
allowed_origins = config("ALLOWED_ORIGINS", default="").split(",")
if allowed_origins and allowed_origins[0]:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info(f"🌐 CORS enabled for origins: {allowed_origins}")

# Security scheme
security = HTTPBearer()

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(ai_router, prefix="/ai", tags=["AI Services"])
app.include_router(users_router, prefix="/user", tags=["User Management"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Budget Buddy Mobile API",
        "version": "1.0.0",
        "status": "healthy",
        "features": [
            "JWT Authentication",
            "AI Services Proxy",
            "User Management",
            "Tier-based Access Control"
        ]
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Test database connection
        from sqlalchemy import text
        session = next(get_db_session())
        session.execute(text("SELECT 1"))
        session.close()
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": "2024-01-01T00:00:00Z"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

if __name__ == "__main__":
    import uvicorn
    
    port = config("PORT", default=8000, cast=int)
    host = config("HOST", default="0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=config("DEBUG", default=False, cast=bool)
    )