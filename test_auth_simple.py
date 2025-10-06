#!/usr/bin/env python3
"""
Simple Authentication Security Tests
Tests password validation, bcrypt compatibility, and security measures
"""

import sys
import os

# Add backend to path for testing
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from auth.utils import (
        validate_password_security,
        hash_password,
        verify_password,
        PasswordValidationError,
        MAX_PASSWORD_BYTES,
        MIN_PASSWORD_LENGTH
    )
    print("✓ Successfully imported authentication modules")
except ImportError as e:
    print(f"✗ Failed to import authentication modules: {e}")
    sys.exit(1)

def test_password_validation():
    """Test password validation rules"""
    print("\n1. Testing Password Validation Rules")
    print("-" * 40)
    
    # Test empty password
    try:
        validate_password_security("")
        print("✗ Empty password should be rejected")
    except PasswordValidationError:
        print("✓ Empty password correctly rejected")
    
    # Test short password
    try:
        validate_password_security("short")
        print("✗ Short password should be rejected")
    except PasswordValidationError:
        print("✓ Short password correctly rejected")
    
    # Test long password (> 72 bytes)
    try:
        validate_password_security("a" * 100)
        print("✗ Long password should be rejected")
    except PasswordValidationError:
        print("✓ Long password correctly rejected")
    
    # Test valid password
    try:
        validate_password_security("ValidPassw0rd123!")
        print("✓ Valid password accepted")
    except PasswordValidationError as e:
        print(f"✗ Valid password should be accepted: {e}")
    
    # Test exactly 72-byte password
    try:
        validate_password_security("a" * 72)
        print("✓ 72-byte password accepted")
    except PasswordValidationError as e:
        print(f"✗ 72-byte password should be accepted: {e}")
    
    # Test unicode password (byte vs character length)
    try:
        unicode_password = "🔐" * 25  # Each emoji is 4 bytes = 100 bytes
        validate_password_security(unicode_password)
        print("✗ Long unicode password should be rejected")
    except PasswordValidationError:
        print("✓ Long unicode password correctly rejected (byte-length check working)")

def test_password_hashing():
    """Test password hashing functionality"""
    print("\n2. Testing Password Hashing")
    print("-" * 40)
    
    # Test basic hashing
    try:
        password = "ValidPassw0rd123!"
        hashed = hash_password(password)
        
        if isinstance(hashed, str) and len(hashed) > 0 and hashed.startswith("$2b$"):
            print("✓ Password hashing produces valid bcrypt hash")
        else:
            print(f"✗ Invalid hash format: {hashed[:50]}...")
            
    except Exception as e:
        print(f"✗ Password hashing failed: {e}")
    
    # Test different passwords produce different hashes
    try:
        hash1 = hash_password("Password123!")
        hash2 = hash_password("DifferentPass456!")
        
        if hash1 != hash2:
            print("✓ Different passwords produce different hashes")
        else:
            print("✗ Different passwords should produce different hashes")
            
    except Exception as e:
        print(f"✗ Hash comparison test failed: {e}")
    
    # Test same password produces different hashes (salt)
    try:
        hash1 = hash_password("SamePassword123!")
        hash2 = hash_password("SamePassword123!")
        
        if hash1 != hash2:
            print("✓ Same password produces different hashes (salt working)")
        else:
            print("✗ Salt not working - same password produced identical hashes")
            
    except Exception as e:
        print(f"✗ Salt test failed: {e}")

def test_password_verification():
    """Test password verification functionality"""
    print("\n3. Testing Password Verification")
    print("-" * 40)
    
    # Test correct password verification
    try:
        password = "ValidPassw0rd123!"
        hashed = hash_password(password)
        
        if verify_password(password, hashed):
            print("✓ Correct password verification works")
        else:
            print("✗ Correct password should verify")
            
    except Exception as e:
        print(f"✗ Password verification test failed: {e}")
    
    # Test incorrect password rejection
    try:
        password = "ValidPassw0rd123!"
        wrong_password = "WrongPassword456!"
        hashed = hash_password(password)
        
        if not verify_password(wrong_password, hashed):
            print("✓ Incorrect password correctly rejected")
        else:
            print("✗ Incorrect password should be rejected")
            
    except Exception as e:
        print(f"✗ Incorrect password test failed: {e}")
    
    # Test unicode password verification
    try:
        unicode_password = "ValidPäss123!"
        hashed = hash_password(unicode_password)
        
        if verify_password(unicode_password, hashed):
            print("✓ Unicode password verification works")
        else:
            print("✗ Unicode password should verify")
            
    except Exception as e:
        print(f"✗ Unicode password test failed: {e}")
    
    # Test malformed hash handling
    try:
        password = "ValidPassw0rd123!"
        malformed_hash = "not_a_valid_hash"
        
        if not verify_password(password, malformed_hash):
            print("✓ Malformed hash correctly rejected")
        else:
            print("✗ Malformed hash should be rejected")
            
    except Exception as e:
        print(f"✗ Malformed hash test failed: {e}")

def test_security_edge_cases():
    """Test security edge cases"""
    print("\n4. Testing Security Edge Cases")
    print("-" * 40)
    
    # Test password length limits
    try:
        validate_password_security("a" * MIN_PASSWORD_LENGTH)
        print(f"✓ Minimum length password ({MIN_PASSWORD_LENGTH} chars) accepted")
    except PasswordValidationError as e:
        print(f"✗ Minimum length password should be accepted: {e}")
    
    try:
        validate_password_security("a" * MAX_PASSWORD_BYTES)
        print(f"✓ Maximum byte length password ({MAX_PASSWORD_BYTES} bytes) accepted")
    except PasswordValidationError as e:
        print(f"✗ Maximum byte length password should be accepted: {e}")
    
    # Test byte vs character counting with Unicode
    try:
        # This is exactly 72 characters but more than 72 bytes
        unicode_test = "ä" * 72  # Each 'ä' is 2 bytes in UTF-8
        validate_password_security(unicode_test)
        print("✗ 72 Unicode chars (>72 bytes) should be rejected")
    except PasswordValidationError:
        print("✓ Unicode byte limit correctly enforced (chars ≠ bytes)")
    
    print(f"\nConfiguration: MIN_LENGTH={MIN_PASSWORD_LENGTH}, MAX_BYTES={MAX_PASSWORD_BYTES}")

def main():
    """Run all authentication security tests"""
    print("🔐 Budget Buddy Authentication Security Test Suite")
    print("=" * 60)
    
    test_password_validation()
    test_password_hashing()
    test_password_verification()
    test_security_edge_cases()
    
    print("\n" + "=" * 60)
    print("🎉 Authentication Security Tests Complete!")
    print("\nIf all tests show ✓, your authentication system is secure!")

if __name__ == "__main__":
    main()