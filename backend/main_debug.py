"""
Budget Buddy Mobile - FastAPI Backend (Debug Version)
Simplified version with enhanced error logging for Railway deployment debugging
"""

import os
import sys
import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from decouple import config
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app with minimal configuration
app = FastAPI(
    title="Budget Buddy Mobile API",
    description="Debug version for Railway deployment troubleshooting",
    version="1.0.0-debug"
)

# Simple CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Simple health check endpoint"""
    return {
        "message": "Budget Buddy Mobile API - Debug Mode",
        "version": "1.0.0-debug",
        "status": "healthy"
    }

@app.get("/debug/env")
async def debug_environment():
    """Debug endpoint to check environment variables"""
    try:
        return {
            "railway_environment": os.getenv("RAILWAY_ENVIRONMENT"),
            "environment": config("ENVIRONMENT", default="unknown"),
            "port": config("PORT", default=8000, cast=int),
            "has_database_url": bool(config("DATABASE_URL", default=None)),
            "has_secret_key": bool(config("SECRET_KEY", default=None)),
            "has_cohere_key": bool(config("COHERE_API_KEY", default=None)),
            "python_version": sys.version,
            "working_directory": os.getcwd(),
            "environment_vars": {k: "***" if "key" in k.lower() or "pass" in k.lower() or "secret" in k.lower() else v 
                               for k, v in os.environ.items() if k.startswith(("DATABASE", "SECRET", "COHERE", "RAILWAY", "PORT", "HOST"))}
        }
    except Exception as e:
        logger.error(f"Debug endpoint error: {e}")
        logger.error(traceback.format_exc())
        return {"error": str(e), "traceback": traceback.format_exc()}

@app.get("/debug/database")
async def debug_database():
    """Debug endpoint to test database connection"""
    try:
        database_url = config("DATABASE_URL", default=None)
        if not database_url:
            return {"error": "DATABASE_URL not configured"}
        
        # Test database connection
        from sqlalchemy import create_engine, text
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 as test"))
            row = result.fetchone()
            
        return {
            "status": "success",
            "test_query_result": row[0] if row else None,
            "database_type": "postgresql" if "postgresql" in database_url else "sqlite"
        }
        
    except Exception as e:
        logger.error(f"Database debug error: {e}")
        logger.error(traceback.format_exc())
        return {"error": str(e), "traceback": traceback.format_exc()}

@app.get("/debug/imports")
async def debug_imports():
    """Debug endpoint to test critical imports"""
    import_results = {}
    
    # Test decouple
    try:
        from decouple import config as test_config
        import_results["decouple"] = "success"
    except Exception as e:
        import_results["decouple"] = f"failed: {e}"
    
    # Test SQLAlchemy
    try:
        from sqlalchemy import create_engine
        import_results["sqlalchemy"] = "success"
    except Exception as e:
        import_results["sqlalchemy"] = f"failed: {e}"
    
    # Test FastAPI components
    try:
        from fastapi.security import HTTPBearer
        import_results["fastapi_security"] = "success"
    except Exception as e:
        import_results["fastapi_security"] = f"failed: {e}"
    
    return {"imports": import_results}

if __name__ == "__main__":
    import uvicorn
    
    port = config("PORT", default=8000, cast=int)
    host = config("HOST", default="0.0.0.0")
    
    logger.info(f"Starting debug server on {host}:{port}")
    
    uvicorn.run(
        "main_debug:app",
        host=host,
        port=port,
        reload=False
    )