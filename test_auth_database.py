#!/usr/bin/env python3
"""
Test database operations for auth service
Specifically test the user registration flow that's failing
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_path))

# Set environment for testing
os.environ['DATABASE_URL'] = 'postgresql://budget_buddy_db_50pb_user:VCdOXkMZdWVufdd4U7BDHrApyGPPM9py@dpg-d3hjcm8gjchc73ahttu0-a.singapore-postgres.render.com:5432/budget_buddy_db_50pb'

async def test_auth_database_operations():
    """Test the specific database operations used in auth registration"""
    try:
        print("🧪 Testing Auth Database Operations")
        print("=" * 50)
        
        # Import auth dependencies
        from database import get_db_session, UserCRUD, init_db
        from auth.utils import hash_password, verify_password
        
        # Initialize database
        print("🔗 Initializing database...")
        await init_db()
        print("✅ Database initialized")
        
        # Test password hashing
        print("🔐 Testing password hashing...")
        test_password = "testpass123"
        hashed = hash_password(test_password)
        print(f"✅ Password hashed: {hashed[:20]}...")
        
        # Verify password
        is_valid = verify_password(test_password, hashed)
        print(f"✅ Password verification: {is_valid}")
        
        # Test database session
        print("💾 Testing database session...")
        session = next(get_db_session())
        
        # Test UserCRUD operations
        print("👤 Testing UserCRUD operations...")
        user_crud = UserCRUD(session)
        
        # Check if test user exists (and clean up if so)
        test_email = "test@example.com"
        existing_user = user_crud.get_user_by_email(test_email)
        if existing_user:
            print(f"⚠️ Test user already exists: {existing_user.email}")
            # In a real scenario, we might delete or skip
        else:
            print("✅ No existing test user found")
        
        # Test user creation (the failing operation)
        if not existing_user:
            print("🆕 Testing user creation...")
            try:
                new_user = user_crud.create_user(
                    email=test_email,
                    full_name="Test User",
                    hashed_password=hash_password("testpass123")
                )
                print(f"✅ User created successfully: {new_user.email}")
                print(f"   User ID: {new_user.id}")
                print(f"   Full Name: {new_user.full_name}")
                print(f"   Tier: {new_user.tier}")
                
            except Exception as e:
                print(f"❌ User creation failed: {e}")
                import traceback
                traceback.print_exc()
        
        session.close()
        print("✅ Database session closed")
        
        return True
        
    except Exception as e:
        print(f"❌ Auth database test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    import asyncio
    
    print("🎯 Auth Service Database Testing")
    print("Testing the exact operations that registration uses")
    print("=" * 60)
    
    success = asyncio.run(test_auth_database_operations())
    
    if success:
        print("\n🎉 Auth database operations working!")
        print("💡 The 500 error might be due to:")
        print("   - Duplicate user registration attempt")
        print("   - Missing environment variables in Render")
        print("   - Different error handling in production")
    else:
        print("\n❌ Auth database operations failing")
        print("🔧 This explains the 500 error in registration")

if __name__ == "__main__":
    main()