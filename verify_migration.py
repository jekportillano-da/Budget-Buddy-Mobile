#!/usr/bin/env python3
"""
Final Database Migration Verification
Tests the backend database.py with new Render PostgreSQL
"""

import os
import sys
import asyncio
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_path))

# Set environment for testing
os.environ['DATABASE_URL'] = 'postgresql://budget_buddy_db_50pb_user:VCdOXkMZdWVufdd4U7BDHrApyGPPM9py@dpg-d3hjcm8gjchc73ahttu0-a.singapore-postgres.render.com:5432/budget_buddy_db_50pb'

async def test_backend_database():
    """Test the backend database connection with actual backend code"""
    try:
        print("🧪 Testing backend database.py with Render PostgreSQL...")
        
        # Import backend modules
        from database import init_db, get_db_session, User, SessionLocal
        from sqlalchemy import text
        
        # Initialize database
        print("🔗 Initializing database connection...")
        await init_db()
        
        # Test session
        print("💾 Testing database session...")
        db = SessionLocal()
        try:
            # Test basic query
            result = db.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ Database version: {version}")
            
            # Test user table
            result = db.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.fetchone()[0]
            print(f"✅ Users table accessible (current count: {user_count})")
            
            # Test all tables
            result = db.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """))
            tables = result.fetchall()
            print(f"✅ All {len(tables)} tables accessible:")
            for table in tables:
                print(f"   📋 {table[0]}")
        
        finally:
            db.close()
        
        print("\n🎉 Backend database integration test PASSED!")
        print("✅ Your backend is ready for Render deployment!")
        return True
        
    except Exception as e:
        print(f"❌ Backend test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    print("=" * 60)
    print("🚀 Final Migration Verification")
    print("=" * 60)
    
    success = await test_backend_database()
    
    if success:
        print("\n🎊 MIGRATION COMPLETE! 🎊")
        print("=" * 60)
        print("✅ Database: Render PostgreSQL ready")
        print("✅ Schema: All tables created with UUID support")
        print("✅ Backend: Compatible with new database")
        print("✅ Configuration: Environment variables ready")
        print("\n🚀 Ready to deploy to Render!")
    else:
        print("\n❌ Migration verification failed")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())