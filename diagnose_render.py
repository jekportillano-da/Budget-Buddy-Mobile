#!/usr/bin/env python3
"""
Render Deployment Diagnosis Script
Check what might be causing the SIGTERM shutdown issue
"""

import os
import sys
import logging
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_path))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def diagnose_environment():
    """Check environment configuration"""
    logger.info("🔍 Environment Diagnosis")
    logger.info("=" * 40)
    
    # Check critical environment variables
    critical_vars = {
        'DATABASE_URL': os.getenv('DATABASE_URL'),
        'PORT': os.getenv('PORT', '10000'),
    }
    
    for var, value in critical_vars.items():
        if value:
            if 'password' in var.lower() or 'key' in var.lower():
                logger.info(f"✅ {var}: ***hidden***")
            else:
                logger.info(f"✅ {var}: {value}")
        else:
            logger.error(f"❌ {var}: NOT SET")
    
    # Check optional variables
    optional_vars = {
        'SECRET_KEY': os.getenv('SECRET_KEY'),
        'JWT_SECRET_KEY': os.getenv('JWT_SECRET_KEY'),
        'COHERE_API_KEY': os.getenv('COHERE_API_KEY'),
    }
    
    logger.info("\n📝 Optional Variables:")
    for var, value in optional_vars.items():
        status = "✅ SET" if value else "⚠️ NOT SET"
        logger.info(f"   {var}: {status}")

def test_basic_import():
    """Test if we can import the main modules"""
    logger.info("\n🧪 Module Import Test")
    logger.info("=" * 40)
    
    try:
        from database import init_db
        logger.info("✅ Database module imported")
    except Exception as e:
        logger.error(f"❌ Database import failed: {e}")
        return False
    
    try:
        from main import app
        logger.info("✅ FastAPI app imported")
    except Exception as e:
        logger.error(f"❌ FastAPI app import failed: {e}")
        return False
    
    return True

def test_database_connection():
    """Test database connectivity"""
    logger.info("\n💾 Database Connection Test")
    logger.info("=" * 40)
    
    try:
        import asyncio
        from database import init_db, SessionLocal
        from sqlalchemy import text
        
        # Test basic connection
        db = SessionLocal()
        result = db.execute(text("SELECT 1"))
        logger.info("✅ Database connection successful")
        db.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

def main():
    logger.info("🏥 Render Deployment Health Check")
    logger.info("=" * 50)
    
    # Set environment for testing
    if not os.getenv('DATABASE_URL'):
        os.environ['DATABASE_URL'] = 'postgresql://budget_buddy_db_50pb_user:VCdOXkMZdWVufdd4U7BDHrApyGPPM9py@dpg-d3hjcm8gjchc73ahttu0-a.singapore-postgres.render.com:5432/budget_buddy_db_50pb'
    
    # Run diagnostics
    diagnose_environment()
    
    if not test_basic_import():
        logger.error("❌ Module import failed - check dependencies")
        sys.exit(1)
    
    if not test_database_connection():
        logger.error("❌ Database connection failed - check DATABASE_URL")
        sys.exit(1)
    
    logger.info("\n🎉 All diagnostic tests passed!")
    logger.info("💡 Deployment should work. Check Render logs for memory issues.")

if __name__ == "__main__":
    main()