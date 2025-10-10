#!/usr/bin/env python3
"""
Password Update Script for Budget Buddy Backend
Updates password for a specific user using proper authentication utilities
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

def update_user_password(email: str, new_password: str):
    """Update password for a specific user"""
    print(f"🔐 Updating password for user: {email}")
    print("=" * 50)
    
    try:
        # Get database session
        db_gen = get_db_session()
        db = next(db_gen)
        print("✓ Database session created")
        
        # Create UserCRUD instance
        user_crud = UserCRUD(db)
        
        # Find the user
        user = user_crud.get_user_by_email(email)
        if not user:
            print(f"✗ User not found: {email}")
            return False
        
        print(f"✓ User found:")
        print(f"  ID: {user.id}")
        print(f"  Email: {user.email}")
        print(f"  Name: {user.full_name}")
        print(f"  Tier: {user.tier}")
        print(f"  Active: {user.is_active}")
        
        # Validate and hash the new password
        try:
            hashed_password = hash_password(new_password)
            print(f"✓ New password hashed successfully")
        except PasswordValidationError as e:
            print(f"✗ Password validation failed: {e}")
            return False
        
        # Update the password
        try:
            user.hashed_password = hashed_password
            db.commit()
            print("✓ Password updated successfully in database")
            
            # Verify the update
            updated_user = user_crud.get_user_by_email(email)
            if updated_user.hashed_password == hashed_password:
                print("✓ Password update verified")
                return True
            else:
                print("✗ Password update failed verification")
                return False
                
        except Exception as e:
            print(f"✗ Failed to update password in database: {e}")
            db.rollback()
            return False
        
        finally:
            db.close()
            
    except Exception as e:
        print(f"✗ Database operation failed: {e}")
        return False

def verify_password_change(email: str, password: str):
    """Verify the password change by testing authentication"""
    print(f"\n🔍 Verifying password change for: {email}")
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
            print("✓ Password verification successful")
            print("✓ User can now login with the new password")
            return True
        else:
            print("✗ Password verification failed")
            return False
            
    except Exception as e:
        print(f"✗ Password verification error: {e}")
        return False

def main():
    """Main password update function"""
    email = "jekportillano@gmail.com"
    new_password = "admin123"
    
    print("🔧 Budget Buddy Password Update Utility")
    print("=" * 50)
    print(f"Target User: {email}")
    print(f"New Password: {new_password}")
    print()
    
    # Update the password
    if update_user_password(email, new_password):
        print("✅ Password update completed successfully!")
        
        # Verify the change
        if verify_password_change(email, new_password):
            print("✅ Password change verified - user can now login!")
        else:
            print("⚠️ Password updated but verification failed")
            
    else:
        print("❌ Password update failed!")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("🎉 Password Update Complete!")
    print(f"User {email} can now login with password: {new_password}")

if __name__ == "__main__":
    main()