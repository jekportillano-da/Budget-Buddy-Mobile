"""
Minimal debug version for Railway deployment
"""

from fastapi import FastAPI
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple FastAPI app
app = FastAPI(title="Budget Buddy Debug API")

@app.get("/")
async def root():
    """Simple health check"""
    logger.info("Root endpoint called")
    return {"message": "Budget Buddy API Debug", "status": "ok"}

@app.get("/test")
async def test():
    """Test endpoint"""
    logger.info("Test endpoint called")
    return {"test": "working", "port": os.getenv("PORT", "8080")}

@app.get("/env")
async def env_check():
    """Environment check"""
    logger.info("Environment check called")
    return {
        "railway_env": os.getenv("RAILWAY_ENVIRONMENT"),
        "environment": os.getenv("ENVIRONMENT"),
        "port": os.getenv("PORT"),
        "database_url_set": bool(os.getenv("DATABASE_URL"))
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run("main_simple:app", host="0.0.0.0", port=port)