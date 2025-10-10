#!/usr/bin/env python3
"""
User Creation/Password Update Script for Budget Buddy Backend
Creates user if they don't exist, or updates password if they do
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from database import get_db_session, UserCRUD
    from auth.utils import hash_password, PasswordValidationError
    print("✓ Successfully imported database and auth modules")
except ImportError as e:
    print(f"✗ Failed to import modules: {e}")
    sys.exit(1)

def create_or_update_user(email: str, password: str, full_name: str = None):
    """Create user if they don't exist, or update password if they do"""
    print(f"👤 Processing user: {email}")
    print("=" * 50)
    
    try:
        # Get database session
        db_gen = get_db_session()
        db = next(db_gen)
        print("✓ Database session created")
        
        # Create UserCRUD instance
        user_crud = UserCRUD(db)
        
        # Check if user exists
        user = user_crud.get_user_by_email(email)
        
        if user:
            print(f"✓ User found - updating password:")
            print(f"  ID: {user.id}")
            print(f"  Email: {user.email}")
            print(f"  Name: {user.full_name}")
            print(f"  Tier: {user.tier}")
            
            # Update password
            try:
                hashed_password = hash_password(password)
                user.hashed_password = hashed_password
                db.commit()
                print("✓ Password updated successfully")
                return user
            except Exception as e:
                print(f"✗ Failed to update password: {e}")
                db.rollback()
                return None
        else:
            print("ℹ️ User not found - creating new user")
            
            # Create new user
            try:
                if not full_name:
                    full_name = email.split('@')[0].title()  # Use email prefix as name
                
                hashed_password = hash_password(password)
                user = user_crud.create_user(
                    email=email,
                    full_name=full_name,
                    hashed_password=hashed_password
                )
                
                print("✓ User created successfully:")
                print(f"  ID: {user.id}")
                print(f"  Email: {user.email}")
                print(f"  Name: {user.full_name}")
                print(f"  Tier: {user.tier}")
                
                return user
                
            except Exception as e:
                print(f"✗ Failed to create user: {e}")
                return None
        
    except Exception as e:
        print(f"✗ Database operation failed: {e}")
        return None
    finally:
        if 'db' in locals():
            db.close()

def verify_login(email: str, password: str):
    """Verify the user can login with the password"""
    print(f"\n🔍 Verifying login for: {email}")
    print("-" * 40)
    
    try:
        from auth.utils import verify_password
        
        # Get database session
        db_gen = get_db_session()
        db = next(db_gen)
        
        # Get user
        user_crud = UserCRUD(db)
        user = user_crud.get_user_by_email(email)
        
        if not user:
            print("✗ User not found for verification")
            return False
        
        # Test password verification
        if verify_password(password, user.hashed_password):
            print("✓ Login verification successful")
            print("✓ User can login with the specified password")
            return True
        else:
            print("✗ Login verification failed")
            return False
            
    except Exception as e:
        print(f"✗ Login verification error: {e}")
        return False
    finally:
        if 'db' in locals():
            db.close()

def main():
    """Main user creation/update function"""
    email = "jekportillano@gmail.com"
    password = "admin123"
    full_name = "Jek Portillano"
    
    print("👥 Budget Buddy User Management Utility")
    print("=" * 50)
    print(f"Target User: {email}")
    print(f"Password: {password}")
    print(f"Full Name: {full_name}")
    print()
    
    # Create or update user
    user = create_or_update_user(email, password, full_name)
    
    if user:
        print("✅ User operation completed successfully!")
        
        # Verify login
        if verify_login(email, password):
            print("✅ Login verification passed!")
        else:
            print("⚠️ User created/updated but login verification failed")
            
    else:
        print("❌ User operation failed!")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("🎉 User Management Complete!")
    print(f"User: {email}")
    print(f"Password: {password}")
    print("Ready for login! 🚀")

if __name__ == "__main__":
    main()