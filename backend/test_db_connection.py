#!/usr/bin/env python3
"""
Database connection diagnostic test for Supabase direct connection
"""

import os
import sys
sys.path.append('.')

from database import engine, DATABASE_URL
from sqlalchemy import text
from decouple import config

def test_database_connection():
    """Test database connectivity with direct connection"""
    
    print("🔍 Database Connection Diagnostic")
    print("=" * 50)
    
    # Show current DATABASE_URL (masked for security)
    masked_url = DATABASE_URL
    if "@" in masked_url:
        parts = masked_url.split("@")
        if len(parts) > 1:
            auth_part = parts[0].split("//")[1]
            if ":" in auth_part:
                user, password = auth_part.split(":")
                masked_password = password[:2] + "*" * (len(password) - 2)
                masked_url = masked_url.replace(f"{user}:{password}", f"{user}:{masked_password}")
    
    print(f"📍 Database URL: {masked_url}")
    print(f"🔧 Engine Pool Size: {engine.pool.size()}")
    print(f"⚙️ Engine Pool Class: {type(engine.pool).__name__}")
    
    try:
        # Test basic connection
        print("\n🔌 Testing database connection...")
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1 as test_value"))
            row = result.fetchone()
            print(f"✅ Connection successful! Test query returned: {row[0]}")
            
            # Test more detailed query
            print("\n📊 Testing database version...")
            version_result = connection.execute(text("SELECT version()"))
            version = version_result.fetchone()[0]
            print(f"📋 Database version: {version[:100]}...")
            
            # Test connection pooling
            print(f"\n🏊 Pool stats - Size: {engine.pool.size()}, Checked out: {engine.pool.checkedout()}")
            
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        print(f"🔍 Error type: {type(e).__name__}")
        
        # Additional diagnostic info
        if "SASL" in str(e):
            print("\n💡 SASL Authentication Error Detected!")
            print("   This typically indicates a connection pooling conflict.")
            print("   Recommendations:")
            print("   1. ✅ Currently using direct connection (port 5432)")
            print("   2. Consider using session pooler (port 6544)")
            print("   3. Or disable SQLAlchemy pooling entirely")
        
        return False
    
    print("\n🎉 All database tests passed!")
    return True

if __name__ == "__main__":
    success = test_database_connection()
    sys.exit(0 if success else 1)