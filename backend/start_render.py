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
        'DATABASE_URL'
    ]
    
    # Optional variables (set defaults if missing)
    optional_vars = {
        'SECRET_KEY': 'render-temp-secret-key-change-in-production',
        'JWT_SECRET_KEY': 'render-temp-jwt-secret-change-in-production', 
        'COHERE_API_KEY': 'optional-cohere-key-for-ai-features'
    }
    
    # Check required vars
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        return False
    
    # Set optional vars with defaults if missing
    for var, default in optional_vars.items():
        if not os.getenv(var):
            os.environ[var] = default
            logger.info(f"⚠️ Set default for {var}")
        else:
            logger.info(f"✅ {var} configured")
    
    logger.info("✅ Environment configuration complete")
    return True

def setup_database():
    """Initialize database tables"""
    try:
        logger.info("🗄️ Database initialization will be handled by FastAPI lifespan...")
        # Database initialization is now handled by FastAPI lifespan in main.py
        # This prevents duplicate initialization and blocking during startup
        logger.info("✅ Database setup delegated to application startup")
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
        
        # Ensure we're in the correct directory (backend/)
        backend_dir = Path(__file__).parent.absolute()
        logger.info(f"📁 Working directory: {backend_dir}")
        os.chdir(backend_dir)
        
        # Render.com optimized configuration for free tier (minimal memory)
        cmd = [
            "gunicorn", 
            "main:app",
            "-w", "1",  # Single worker for free tier
            "-k", "uvicorn.workers.UvicornWorker",
            "--bind", f"0.0.0.0:{port}",
            "--timeout", "120",  # Reduced timeout
            "--graceful-timeout", "20",  # Shorter graceful shutdown
            "--keep-alive", "2",  # Keep connections alive briefly
            "--max-requests", "200",  # Restart worker more frequently (lower memory)
            "--max-requests-jitter", "20",  # Less jitter
            "--access-logfile", "-",  # Log to stdout
            "--error-logfile", "-",   # Log errors to stderr
            "--log-level", "info"
        ]
        
        logger.info(f"Running command: {' '.join(cmd)}")
        logger.info(f"Current working directory: {os.getcwd()}")
        subprocess.run(cmd, check=True, cwd=backend_dir)
        
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