#!/usr/bin/env python3
"""
Test bcrypt hash lengths and database compatibility
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from auth.utils import hash_password
    print("✓ Successfully imported hash_password")
except ImportError as e:
    print(f"✗ Failed to import: {e}")
    sys.exit(1)

def test_hash_lengths():
    """Test various password hash lengths"""
    print("🔍 Testing bcrypt hash lengths")
    print("=" * 40)
    
    test_passwords = [
        "shortpwd",
        "ValidPassword123!",
        "A" * 20,
        "A" * 50,
        "A" * 72,  # Max bcrypt input length
        "🔐TestPassword123!"  # Unicode
    ]
    
    for i, password in enumerate(test_passwords, 1):
        try:
            print(f"\n{i}. Testing password: '{password[:20]}{'...' if len(password) > 20 else ''}'")
            print(f"   Input length: {len(password)} chars, {len(password.encode('utf-8'))} bytes")
            
            hashed = hash_password(password)
            print(f"   Hash length: {len(hashed)} characters")
            print(f"   Hash preview: {hashed[:50]}...")
            
            # Verify hash format
            if hashed.startswith("$2b$"):
                print("   ✓ Valid bcrypt format")
            else:
                print("   ✗ Invalid hash format")
                
        except Exception as e:
            print(f"   ✗ Hash failed: {e}")
    
    print(f"\n{'='*40}")
    print("Database column: hashed_password VARCHAR(255)")
    print("All hashes should fit comfortably in 255 chars")

if __name__ == "__main__":
    test_hash_lengths()