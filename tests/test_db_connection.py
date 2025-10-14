#!/usr/bin/env python3
"""
Database Connection Test Script
Tests connection to Render PostgreSQL database
"""

import os
import sys
from pathlib import Path

# Add parent and backend directories to Python path
parent_dir = Path(__file__).parent.parent
backend_dir = parent_dir / 'backend'
sys.path.insert(0, str(parent_dir))
sys.path.insert(0, str(backend_dir))

try:
    from database import DATABASE_URL, engine, SessionLocal
    from sqlalchemy import text
    print("✅ Database modules imported successfully")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

def test_connection():
    """Test database connection"""
    print("🔍 Testing database connection...")
    print(f"🔗 Database URL: {DATABASE_URL.split('@')[0] if '@' in DATABASE_URL else DATABASE_URL}@***")
    
    try:
        # Test basic connection
        session = SessionLocal()
        result = session.execute(text("SELECT 1 as test"))
        test_value = result.fetchone()[0]
        session.close()
        
        if test_value == 1:
            print("✅ Database connection successful!")
            return True
        else:
            print(f"❌ Unexpected result: {test_value}")
            return False
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_schema():
    """Test if required tables exist"""
    print("🔍 Testing database schema...")
    
    required_tables = [
        'users',
        'user_profiles', 
        'app_settings',
        'budget_data',
        'expenses',
        'refresh_tokens',
        'password_reset_tokens'
    ]
    
    try:
        session = SessionLocal()
        
        for table in required_tables:
            result = session.execute(text(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = '{table}'
                );
            """))
            
            exists = result.fetchone()[0]
            status = "✅" if exists else "❌"
            print(f"{status} Table '{table}': {'EXISTS' if exists else 'MISSING'}")
            
        session.close()
        print("✅ Schema test completed")
        return True
        
    except Exception as e:
        print(f"❌ Schema test failed: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 50)
    print("🧪 Budget Buddy Database Connection Test")
    print("=" * 50)
    
    # Test connection
    if not test_connection():
        print("❌ Connection test failed - check your DATABASE_URL")
        sys.exit(1)
    
    # Test schema
    if not test_schema():
        print("⚠️ Schema test failed - you may need to run the migration")
        print("💡 Run: psql -h [HOST] -U [USER] -d [DB] -f render_schema.sql")
    
    print("=" * 50)
    print("🎉 Database tests completed!")
    print("✅ Ready for FastAPI application startup")
    print("=" * 50)

if __name__ == "__main__":
    main()