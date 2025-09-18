#!/usr/bin/env python3
"""
Production startup script for Railway deployment
Handles database migration and server startup
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
        logger.error(f"Missing required environment variables: {missing_vars}")
        return False
    
    logger.info("✅ All required environment variables are set")
    return True

def run_database_migration():
    """Run database migrations"""
    try:
        logger.info("🔄 Running database migrations...")
        
        # Initialize Alembic if not already done
        if not os.path.exists("alembic"):
            logger.info("Initializing Alembic...")
            subprocess.run(["alembic", "init", "alembic"], check=True)
        
        # Generate migration if needed
        result = subprocess.run(
            ["alembic", "revision", "--autogenerate", "-m", "Production migration"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            logger.info("Migration generated successfully")
        else:
            logger.info("No migration needed")
        
        # Apply migrations
        subprocess.run(["alembic", "upgrade", "head"], check=True)
        logger.info("✅ Database migrations completed")
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Database migration failed: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error during migration: {e}")
        return False

def start_server():
    """Start the FastAPI server"""
    try:
        port = os.getenv("PORT", "8000")
        logger.info(f"🚀 Starting Budget Buddy Backend on port {port}")
        
        # Use uvicorn for production
        cmd = [
            "uvicorn", 
            "main:app",
            "--host", "0.0.0.0",
            "--port", port,
            "--workers", "2",  # Railway gives us 2 vCPUs
            "--loop", "uvloop",
            "--http", "httptools"
        ]
        
        subprocess.run(cmd, check=True)
        
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Server startup failed: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user")
        sys.exit(0)

def main():
    """Main production startup function"""
    logger.info("🎯 Budget Buddy Backend - Production Startup")
    logger.info("=" * 50)
    
    # Check environment
    if not check_environment():
        logger.error("❌ Environment check failed")
        sys.exit(1)
    
    # Run migrations (skip for now if problematic)
    try:
        run_database_migration()
    except Exception as e:
        logger.warning(f"⚠️ Migration skipped: {e}")
        logger.info("Server will attempt to create tables on startup")
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()