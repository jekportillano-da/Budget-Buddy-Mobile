#!/usr/bin/env python3
"""
Test database user creation directly to isolate the issue
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from database import get_db_session, UserCRUD
    from auth.utils import hash_password
    print("✓ Successfully imported database modules")
except ImportError as e:
    print(f"✗ Failed to import: {e}")
    sys.exit(1)

def test_database_user_creation():
    """Test direct database user creation"""
    print("🗄️ Testing Database User Creation")
    print("=" * 40)
    
    try:
        # Get database session
        db_gen = get_db_session()
        db = next(db_gen)
        print("✓ Database session created")
        
        # Create UserCRUD instance
        user_crud = UserCRUD(db)
        print("✓ UserCRUD instance created")
        
        # Test data
        test_email = "dbtest@example.com"
        test_password = "ValidPassword123!"
        test_name = "Database Test User"
        
        print(f"\nTesting with:")
        print(f"  Email: {test_email}")
        print(f"  Password: {test_password}")
        print(f"  Name: {test_name}")
        
        # Check if user already exists
        existing_user = user_crud.get_user_by_email(test_email)
        if existing_user:
            print("⚠️ User already exists, will cause duplicate error")
            return
        else:
            print("✓ User doesn't exist, safe to create")
        
        # Hash password
        try:
            hashed_password = hash_password(test_password)
            print(f"✓ Password hashed successfully: {len(hashed_password)} chars")
        except Exception as e:
            print(f"✗ Password hashing failed: {e}")
            return
        
        # Create user
        try:
            user = user_crud.create_user(
                email=test_email,
                full_name=test_name,
                hashed_password=hashed_password
            )
            print(f"✓ User created successfully!")
            print(f"  User ID: {user.id}")
            print(f"  Email: {user.email}")
            print(f"  Name: {user.full_name}")
            print(f"  Active: {user.is_active}")
            
        except Exception as e:
            print(f"✗ User creation failed: {e}")
            print(f"Error type: {type(e).__name__}")
            
            # Check if it's a constraint error
            if "unique" in str(e).lower():
                print("  -> Looks like a unique constraint violation")
            elif "length" in str(e).lower():
                print("  -> Looks like a field length issue")
            elif "uuid" in str(e).lower():
                print("  -> Looks like a UUID generation issue")
            else:
                print(f"  -> Unknown database error: {str(e)}")
        
        finally:
            db.close()
            
    except Exception as e:
        print(f"✗ Database connection failed: {e}")

if __name__ == "__main__":
    test_database_user_creation()