#!/usr/bin/env python3
"""
Railway Deployment Diagnostic Script
Run this to check environment variables and database connectivity
"""

import os
import sys
from decouple import config

def main():
    print("🔍 Budget Buddy Railway Diagnostic")
    print("=" * 50)
    
    # Check critical environment variables
    print("\n📋 Environment Variables:")
    
    # Check Railway environment
    railway_env = os.getenv("RAILWAY_ENVIRONMENT")
    print(f"RAILWAY_ENVIRONMENT: {railway_env}")
    
    # Check database URL
    database_url = config("DATABASE_URL", default=None)
    if database_url:
        # Mask password for security
        masked_url = database_url
        if "@" in masked_url and ":" in masked_url:
            parts = masked_url.split("@")
            if len(parts) > 1:
                creds = parts[0].split("://")[1]
                if ":" in creds:
                    user_pass = creds.split(":")
                    masked_url = masked_url.replace(user_pass[1], "***")
        print(f"DATABASE_URL: {masked_url}")
    else:
        print("❌ DATABASE_URL: Not configured")
    
    # Check JWT secret
    secret_key = config("SECRET_KEY", default=None)
    if secret_key:
        print(f"SECRET_KEY: {'*' * len(secret_key[:8])}... (length: {len(secret_key)})")
    else:
        print("❌ SECRET_KEY: Not configured")
    
    # Check AI API keys
    cohere_key = config("COHERE_API_KEY", default=None)
    print(f"COHERE_API_KEY: {'Configured' if cohere_key else 'Not configured'}")
    
    # Check port
    port = config("PORT", default=8000, cast=int)
    print(f"PORT: {port}")
    
    # Test database connection
    print("\n🔗 Database Connection Test:")
    if database_url:
        try:
            from sqlalchemy import create_engine, text
            engine = create_engine(database_url)
            with engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                print("✅ Database connection successful")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
    else:
        print("❌ Cannot test database - DATABASE_URL not configured")
    
    # Test basic imports
    print("\n📦 Import Test:")
    try:
        from main import app
        print("✅ Main app import successful")
    except Exception as e:
        print(f"❌ Main app import failed: {e}")
    
    print("\n" + "=" * 50)
    print("Diagnostic complete!")

if __name__ == "__main__":
    main()