#!/usr/bin/env python3
"""
Test database connection with production-like Supabase configuration
"""

import os
import sys
sys.path.append('.')

from sqlalchemy import create_engine, text

# Simulate production Supabase environment
# Replace these with your actual Supabase values (temporarily for testing)
SUPABASE_HOST = "db.your-project.supabase.co"  # Replace with actual host
SUPABASE_DATABASE = "postgres"
SUPABASE_USER = "postgres"
SUPABASE_PASSWORD = "your-password"  # Replace with actual password

def test_direct_connection():
    """Test direct connection to Supabase (port 5432)"""
    
    # Direct connection string (port 5432)
    DATABASE_URL = f"postgresql+psycopg2://{SUPABASE_USER}:{SUPABASE_PASSWORD}@{SUPABASE_HOST}:5432/{SUPABASE_DATABASE}"
    
    print("🔍 Testing Direct Connection (Port 5432)")
    print("=" * 50)
    print(f"📍 Host: {SUPABASE_HOST}")
    print(f"🔌 Port: 5432 (Direct)")
    
    try:
        engine = create_engine(
            DATABASE_URL,
            pool_size=5,
            max_overflow=10,
            pool_timeout=30,
            pool_recycle=3600,
            pool_pre_ping=True
        )
        
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1 as test_value"))
            row = result.fetchone()
            print(f"✅ Direct connection successful! Test: {row[0]}")
            
            # Test PostgreSQL version
            version_result = connection.execute(text("SELECT version()"))
            version = version_result.fetchone()[0]
            print(f"📋 PostgreSQL version: {version[:100]}...")
            
            return True
            
    except Exception as e:
        print(f"❌ Direct connection failed: {str(e)}")
        return False

def test_session_pooler():
    """Test session pooler connection (port 6544)"""
    
    # Session pooler string (port 6544)
    DATABASE_URL = f"postgresql+psycopg2://{SUPABASE_USER}:{SUPABASE_PASSWORD}@{SUPABASE_HOST}:6544/{SUPABASE_DATABASE}"
    
    print("\n🔍 Testing Session Pooler (Port 6544)")
    print("=" * 50)
    print(f"📍 Host: {SUPABASE_HOST}")
    print(f"🔌 Port: 6544 (Session Pooler)")
    
    try:
        engine = create_engine(
            DATABASE_URL,
            pool_size=3,          # Smaller pool for pooled connection
            max_overflow=5,
            pool_timeout=20,
            pool_recycle=1800,    # Shorter recycle for pooled
            pool_pre_ping=True
        )
        
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1 as test_value"))
            row = result.fetchone()
            print(f"✅ Session pooler successful! Test: {row[0]}")
            return True
            
    except Exception as e:
        print(f"❌ Session pooler failed: {str(e)}")
        return False

def show_recommendations():
    """Show configuration recommendations"""
    
    print("\n💡 Configuration Recommendations")
    print("=" * 50)
    
    print("\n🎯 For Render.com deployment, use one of these DATABASE_URL formats:")
    print("1. 📍 Direct Connection (Recommended):")
    print("   postgresql+psycopg2://user:pass@host:5432/database")
    print("   - Bypasses all pooling conflicts")
    print("   - Most reliable for SASL auth issues")
    
    print("\n2. 🔄 Session Pooler (Alternative):")
    print("   postgresql+psycopg2://user:pass@host:6544/database")
    print("   - Uses Supabase session pooling")
    print("   - Better for high-traffic apps")
    
    print("\n3. ⚠️ Avoid Transaction Pooler:")
    print("   postgresql+psycopg2://user:pass@host:6543/database")
    print("   - Causes SASL authentication conflicts")
    print("   - Should be avoided for FastAPI apps")
    
    print("\n🔧 SQLAlchemy Engine Configuration:")
    print("```python")
    print("engine = create_engine(")
    print("    DATABASE_URL,")
    print("    pool_size=5,          # Conservative pool size")
    print("    max_overflow=10,      # Limited overflow")
    print("    pool_timeout=30,      # Reasonable timeout")
    print("    pool_recycle=3600,    # Recycle hourly")
    print("    pool_pre_ping=True    # Verify connections")
    print(")")
    print("```")

if __name__ == "__main__":
    print("⚠️ This is a template test - update with your actual Supabase credentials")
    print("🔧 Update SUPABASE_HOST and SUPABASE_PASSWORD variables above")
    print()
    
    # For now, just show recommendations
    show_recommendations()
    
    print("\n📝 Next Steps:")
    print("1. Update your Render.com DATABASE_URL to use port 5432")
    print("2. Redeploy your application")  
    print("3. Monitor logs for SASL authentication errors")
    print("4. If port 5432 doesn't work, try port 6544")