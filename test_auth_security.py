#!/usr/bin/env python3
"""
Comprehensive Authentication Security Tests
Tests password validation, bcrypt compatibility, and security measures
"""

import sys
import os

# Add backend to path for testing
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from auth.utils import (
    validate_password_security,
    hash_password,
    verify_password,
    PasswordValidationError,
    MAX_PASSWORD_BYTES,
    MIN_PASSWORD_LENGTH
)

class TestPasswordValidation:
    """Test password validation rules"""
    
    def test_empty_password_rejected(self):
        """Empty passwords should be rejected"""
        try:
            validate_password_security("")
            assert False, "Should have raised PasswordValidationError"
        except PasswordValidationError as e:
            assert "Password cannot be empty" in str(e)
    
    def test_short_password_rejected(self):
        """Passwords shorter than minimum length should be rejected"""
        short_password = "a" * (MIN_PASSWORD_LENGTH - 1)
        with pytest.raises(PasswordValidationError, match=f"Password must be at least {MIN_PASSWORD_LENGTH}"):
            validate_password_security(short_password)
    
    def test_long_password_rejected(self):
        """Passwords longer than 72 bytes should be rejected"""
        # Create a password that's exactly 73 bytes (should fail)
        long_password = "a" * 73
        with pytest.raises(PasswordValidationError, match="Password too long"):
            validate_password_security(long_password)
    
    def test_unicode_password_byte_limit(self):
        """Test that unicode characters are properly measured in bytes"""
        # Unicode characters can be multiple bytes
        unicode_password = "🔐" * 25  # Each emoji is 4 bytes = 100 bytes total
        with pytest.raises(PasswordValidationError, match="Password too long"):
            validate_password_security(unicode_password)
    
    def test_valid_password_accepted(self):
        """Valid passwords should pass validation"""
        valid_passwords = [
            "ValidPass123!",
            "a" * MIN_PASSWORD_LENGTH,
            "a" * MAX_PASSWORD_BYTES,  # Exactly at the limit
        ]
        
        for password in valid_passwords:
            # Should not raise any exception
            validate_password_security(password)
    
    def test_edge_case_72_bytes_exactly(self):
        """Password with exactly 72 bytes should be accepted"""
        password_72_bytes = "a" * 72
        validate_password_security(password_72_bytes)  # Should not raise


class TestPasswordHashing:
    """Test password hashing functionality"""
    
    def test_hash_password_success(self):
        """Valid passwords should hash successfully"""
        password = "ValidPassword123!"
        hashed = hash_password(password)
        
        assert isinstance(hashed, str)
        assert len(hashed) > 0
        assert hashed != password  # Should be different from original
        assert hashed.startswith("$2b$")  # bcrypt format
    
    def test_hash_password_invalid_length(self):
        """Invalid password length should raise PasswordValidationError"""
        with pytest.raises(PasswordValidationError):
            hash_password("short")  # Too short
        
        with pytest.raises(PasswordValidationError):
            hash_password("a" * 100)  # Too long
    
    def test_hash_password_unicode(self):
        """Valid unicode passwords should hash properly"""
        unicode_password = "ValidPäss123!"  # Contains unicode
        hashed = hash_password(unicode_password)
        
        assert isinstance(hashed, str)
        assert hashed.startswith("$2b$")
    
    def test_different_passwords_different_hashes(self):
        """Different passwords should produce different hashes"""
        password1 = "ValidPassword123!"
        password2 = "DifferentPassword456!"
        
        hash1 = hash_password(password1)
        hash2 = hash_password(password2)
        
        assert hash1 != hash2
    
    def test_same_password_different_salts(self):
        """Same password should produce different hashes due to salt"""
        password = "ValidPassword123!"
        
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        
        # Should be different due to random salt
        assert hash1 != hash2


class TestPasswordVerification:
    """Test password verification functionality"""
    
    def test_verify_correct_password(self):
        """Correct password should verify successfully"""
        password = "ValidPassword123!"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True
    
    def test_verify_incorrect_password(self):
        """Incorrect password should fail verification"""
        password = "ValidPassword123!"
        wrong_password = "WrongPassword456!"
        hashed = hash_password(password)
        
        assert verify_password(wrong_password, hashed) is False
    
    def test_verify_unicode_passwords(self):
        """Unicode passwords should verify correctly"""
        password = "ValidPäss123!"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True
        assert verify_password("WrongPäss123!", hashed) is False
    
    def test_verify_with_malformed_hash(self):
        """Malformed hashes should return False, not crash"""
        password = "ValidPassword123!"
        malformed_hash = "not_a_valid_hash"
        
        assert verify_password(password, malformed_hash) is False
    
    def test_verify_empty_inputs(self):
        """Empty inputs should be handled gracefully"""
        password = "ValidPassword123!"
        hashed = hash_password(password)
        
        assert verify_password("", hashed) is False
        assert verify_password(password, "") is False


class TestSecurityEdgeCases:
    """Test security edge cases and attack vectors"""
    
    def test_null_byte_injection(self):
        """Test that null bytes don't cause issues"""
        password_with_null = "ValidPassword\x00123!"
        
        # Should either reject or handle safely
        try:
            hashed = hash_password(password_with_null)
            # If it hashes, verification should work
            assert verify_password(password_with_null, hashed) is True
        except PasswordValidationError:
            # Or it should be rejected - either is acceptable
            pass
    
    def test_very_long_unicode_sequence(self):
        """Test handling of very long unicode sequences"""
        # Create a string with multi-byte characters that exceeds byte limit
        unicode_password = "🔐💎🚀" * 10  # Each is 4 bytes, total > 72 bytes
        
        with pytest.raises(PasswordValidationError, match="Password too long"):
            validate_password_security(unicode_password)
    
    def test_password_with_newlines(self):
        """Test passwords containing newlines"""
        password_with_newline = "Valid\nPassword123!"
        
        if len(password_with_newline.encode('utf-8')) <= MAX_PASSWORD_BYTES:
            hashed = hash_password(password_with_newline)
            assert verify_password(password_with_newline, hashed) is True


def run_all_tests():
    """Run all authentication security tests"""
    print("🔐 Running Budget Buddy Authentication Security Tests")
    print("=" * 60)
    
    # Test password validation
    print("\n1. Testing password validation...")
    validation_tests = TestPasswordValidation()
    
    test_methods = [
        validation_tests.test_empty_password_rejected,
        validation_tests.test_short_password_rejected,
        validation_tests.test_long_password_rejected,
        validation_tests.test_unicode_password_byte_limit,
        validation_tests.test_valid_password_accepted,
        validation_tests.test_edge_case_72_bytes_exactly
    ]
    
    for test in test_methods:
        try:
            test()
            print(f"  ✓ {test.__name__}")
        except Exception as e:
            print(f"  ✗ {test.__name__}: {e}")
    
    # Test password hashing
    print("\n2. Testing password hashing...")
    hashing_tests = TestPasswordHashing()
    
    hash_test_methods = [
        hashing_tests.test_hash_password_success,
        hashing_tests.test_hash_password_invalid_length,
        hashing_tests.test_hash_password_unicode,
        hashing_tests.test_different_passwords_different_hashes,
        hashing_tests.test_same_password_different_salts
    ]
    
    for test in hash_test_methods:
        try:
            test()
            print(f"  ✓ {test.__name__}")
        except Exception as e:
            print(f"  ✗ {test.__name__}: {e}")
    
    # Test password verification
    print("\n3. Testing password verification...")
    verify_tests = TestPasswordVerification()
    
    verify_test_methods = [
        verify_tests.test_verify_correct_password,
        verify_tests.test_verify_incorrect_password,
        verify_tests.test_verify_unicode_passwords,
        verify_tests.test_verify_with_malformed_hash,
        verify_tests.test_verify_empty_inputs
    ]
    
    for test in verify_test_methods:
        try:
            test()
            print(f"  ✓ {test.__name__}")
        except Exception as e:
            print(f"  ✗ {test.__name__}: {e}")
    
    # Test security edge cases
    print("\n4. Testing security edge cases...")
    security_tests = TestSecurityEdgeCases()
    
    security_test_methods = [
        security_tests.test_null_byte_injection,
        security_tests.test_very_long_unicode_sequence,
        security_tests.test_password_with_newlines
    ]
    
    for test in security_test_methods:
        try:
            test()
            print(f"  ✓ {test.__name__}")
        except Exception as e:
            print(f"  ✗ {test.__name__}: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Authentication Security Tests Complete!")


if __name__ == "__main__":
    run_all_tests()