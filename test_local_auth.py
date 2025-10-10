#!/usr/bin/env python3
"""
Local test of authentication functions to debug issues
"""
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_password_hashing():
    """Test the password hashing function locally"""
    try:
        from auth.utils import hash_password, verify_password
        
        # Test with various password lengths
        test_passwords = [
            "short",
            "medium_password_123",
            "A" * 50,  # 50 characters
            "A" * 70,  # 70 characters  
            "A" * 100, # 100 characters (should be truncated)
            "🚀" * 30,  # Unicode characters (might be longer in bytes)
        ]
        
        print("=== Testing Password Hashing ===")
        for i, password in enumerate(test_passwords):
            try:
                print(f"\nTest {i+1}: Password length {len(password)} chars")
                password_bytes = password.encode('utf-8')
                print(f"  Byte length: {len(password_bytes)}")
                
                # Test hashing
                hashed = hash_password(password)
                print(f"  Hash generated: {len(hashed)} chars")
                
                # Test verification
                is_valid = verify_password(password, hashed)
                print(f"  Verification: {'✓' if is_valid else '✗'}")
                
                if not is_valid:
                    print(f"  ERROR: Password verification failed!")
                    return False
                    
            except Exception as e:
                print(f"  ERROR: {e}")
                return False
        
        print("\n✓ All password hashing tests passed!")
        return True
        
    except ImportError as e:
        print(f"Import error: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

def test_database_models():
    """Test database model imports"""
    try:
        print("\n=== Testing Database Models ===")
        from database import User, engine, get_db_session
        print("✓ Database models imported successfully")
        
        # Test database connection
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✓ Database connection test passed")
            
        return True
        
    except ImportError as e:
        print(f"Import error: {e}")
        return False
    except Exception as e:
        print(f"Database connection error: {e}")
        return False

def test_user_crud():
    """Test user CRUD operations"""
    try:
        print("\n=== Testing User CRUD ===")
        from users.crud import UserCRUD
        from database import get_db_session
        
        # Create a database session
        db_gen = get_db_session()
        db = next(db_gen)
        
        user_crud = UserCRUD(db)
        
        # Test checking for existing user (should not exist)
        existing_user = user_crud.get_user_by_email("test@example.com")
        print(f"✓ User lookup test: {existing_user is None}")
        
        return True
        
    except ImportError as e:
        print(f"Import error: {e}")
        return False
    except Exception as e:
        print(f"CRUD test error: {e}")
        return False

if __name__ == "__main__":
    print("=== Local Authentication Component Testing ===")
    
    success = True
    
    # Test 1: Password hashing
    if not test_password_hashing():
        success = False
    
    # Test 2: Database models
    if not test_database_models():
        success = False
    
    # Test 3: User CRUD
    if not test_user_crud():
        success = False
    
    if success:
        print("\n🎉 All local tests passed! The issue might be deployment-specific.")
    else:
        print("\n❌ Some tests failed. Check the errors above.")