#!/usr/bin/env python3
"""
Render.com optimized startup script for Budget Buddy Backend
Designed for free tier limitations with proper resource management
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_environment():
    """Check required environment variables"""
    required_vars = [
        'DATABASE_URL',
        'SECRET_KEY',
        'COHERE_API_KEY'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
    
    logger.info("✅ All required environment variables found")
    return True

def setup_database():
    """Initialize database tables"""
    try:
        logger.info("🗄️ Setting up database...")
        from database import init_db
        init_db()
        logger.info("✅ Database initialized successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Database setup failed: {e}")
        return False

def start_server():
    """Start the FastAPI server with Render.com optimized settings"""
    try:
        port = os.getenv("PORT", "10000")  # Render uses port 10000 by default
        logger.info(f"🚀 Starting Budget Buddy Backend on port {port}")
        logger.info("⚙️ Optimized for Render.com free tier")
        
        # Render.com optimized configuration
        cmd = [
            "gunicorn", 
            "main:app",
            "-w", "1",  # Single worker for free tier
            "-k", "uvicorn.workers.UvicornWorker",
            "--bind", f"0.0.0.0:{port}",
            "--timeout", "120",  # Longer timeout for slow requests
            "--keep-alive", "2",  # Keep connections alive
            "--max-requests", "1000",  # Restart worker after 1000 requests
            "--max-requests-jitter", "100",  # Add jitter to restarts
            "--preload",  # Preload app for faster startup
            "--access-logfile", "-",  # Log to stdout
            "--error-logfile", "-",   # Log errors to stderr
            "--log-level", "info"
        ]
        
        logger.info(f"Running command: {' '.join(cmd)}")
        subprocess.run(cmd, check=True)
        
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Server startup failed: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        logger.info("🛑 Received shutdown signal")
        sys.exit(0)

def main():
    """Main startup function"""
    logger.info("=" * 50)
    logger.info("🎯 Budget Buddy Backend - Render.com Edition")
    logger.info("=" * 50)
    
    # Check environment
    if not check_environment():
        sys.exit(1)
    
    # Setup database
    if not setup_database():
        sys.exit(1)
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()