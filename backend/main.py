"""
Budget Buddy Mobile - FastAPI Backend
Main application entry point with production support
"""

import os
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
    
    try:
        await init_db()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        # Don't raise the exception to allow the app to start without DB
        logger.warning("⚠️ Continuing without database initialization")
    
    logger.info("🚀 FastAPI application ready")
    
    yield
    # Shutdown
    logger.info("🛑 Shutting down Budget Buddy Backend...")

# Create FastAPI app
app = FastAPI(
    title="Budget Buddy - AI-Powered Financial Intelligence",
    description="Advanced personal finance management platform with AI-driven insights, Philippine market specialization, and intelligent budgeting for Filipino users. Features multi-tier access, smart expense categorization, and culturally-aware financial recommendations.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - Allow common development and production origins
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:8080", 
    "http://localhost:8081",
    "exp://localhost:8080",
    "exp://localhost:8081",
    "https://budgetbuddy.app",
    "https://www.budgetbuddy.app"
]

# Add deployment URL if available
deployment_url = os.getenv("DEPLOYMENT_URL")
if deployment_url:
    allowed_origins.append(f"https://{deployment_url}")

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
    """API Information and Features"""
    return {
        "message": "Budget Buddy - AI-Powered Financial Intelligence Platform",
        "version": "1.0.0",
        "status": "operational",
        "market_focus": "Philippine Financial Services",
        "key_features": [
            "AI-Powered Financial Analysis",
            "Philippine Market Intelligence", 
            "Multi-Tier Premium Access",
            "Smart Expense Categorization",
            "Cultural Context Financial Advice",
            "Peso-Optimized Budgeting",
            "Local Investment Recommendations",
            "Advanced Financial Health Scoring"
        ],
        "competitive_advantages": [
            "Philippine-specific AI prompts",
            "Local market data integration", 
            "Cultural spending pattern analysis",
            "OFW remittance optimization",
            "Regional cost-of-living intelligence"
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