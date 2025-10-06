#!/usr/bin/env python3
"""
Minimal Render startup script for Budget Buddy Backend
Focus on database connectivity and basic functionality
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Minimal startup for Render deployment"""
    logger.info("🚀 Starting Budget Buddy Backend (Minimal Mode)")
    
    # Get port from environment
    port = os.getenv("PORT", "10000")
    
    # Check if DATABASE_URL is set
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        logger.error("❌ DATABASE_URL not set")
        sys.exit(1)
    
    logger.info("✅ DATABASE_URL configured")
    logger.info(f"🚀 Starting server on port {port}")
    
    # Minimal gunicorn configuration
    cmd = [
        "gunicorn", 
        "main:app",
        "-w", "1",  # Single worker
        "-k", "uvicorn.workers.UvicornWorker", 
        "--bind", f"0.0.0.0:{port}",
        "--timeout", "120",  # Shorter timeout
        "--access-logfile", "-",
        "--error-logfile", "-",
        "--log-level", "info"
    ]
    
    logger.info(f"Command: {' '.join(cmd)}")
    
    try:
        subprocess.run(cmd, check=True)
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()