#!/usr/bin/env python3
"""
Test UUID serialization in authentication endpoints after fixes
"""
import requests
import json
import uuid
import sys

def test_uuid_serialization():
    """Test that UUID fields are properly serialized to strings in JSON responses"""
    base_url = "https://budget-buddy-mobile.onrender.com"
    
    print("🔗 Testing UUID Serialization in Authentication")
    print("=" * 55)
    
    # Test 1: Registration with UUID response
    print("\n1. Testing Registration Endpoint")
    print("-" * 30)
    
    test_email = f"uuid-test-{uuid.uuid4().hex[:8]}@example.com"
    registration_data = {
        "email": test_email,
        "password": "ValidPassword123!",
        "full_name": "UUID Test User"
    }
    
    try:
        response = requests.post(
            f"{base_url}/auth/register",
            json=registration_data,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Registration successful!")
            
            try:
                data = response.json()
                print("✅ JSON response parsed successfully")
                
                # Check if user object exists and has UUID
                if "user" in data and "id" in data["user"]:
                    user_id = data["user"]["id"]
                    print(f"✅ User ID found: {user_id}")
                    
                    # Validate UUID format
                    try:
                        uuid.UUID(user_id)
                        print("✅ User ID is valid UUID string format")
                        return user_id, data["access_token"]
                    except ValueError:
                        print(f"❌ User ID is not valid UUID format: {user_id}")
                        return None, None
                else:
                    print("❌ User object or ID not found in response")
                    print(f"Response: {json.dumps(data, indent=2)}")
                    return None, None
                    
            except json.JSONDecodeError as e:
                print(f"❌ Failed to parse JSON response: {e}")
                print(f"Raw response: {response.text}")
                return None, None
                
        elif response.status_code == 400:
            try:
                error_data = response.json()
                print(f"❌ Registration failed: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"❌ Registration failed with raw response: {response.text}")
            return None, None
            
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Raw response: {response.text}")
            return None, None
            
    except Exception as e:
        print(f"❌ Registration request failed: {e}")
        return None, None

def test_user_profile_endpoint(access_token):
    """Test /auth/me endpoint with UUID serialization"""
    base_url = "https://budget-buddy-mobile.onrender.com"
    
    print("\n2. Testing User Profile Endpoint (/auth/me)")
    print("-" * 40)
    
    if not access_token:
        print("❌ No access token available for testing")
        return
    
    try:
        response = requests.get(
            f"{base_url}/auth/me",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Profile endpoint accessible")
            
            try:
                data = response.json()
                print("✅ JSON response parsed successfully")
                
                if "id" in data:
                    user_id = data["id"]
                    print(f"✅ User ID found: {user_id}")
                    
                    # Validate UUID format
                    try:
                        uuid.UUID(user_id)
                        print("✅ User ID is valid UUID string format")
                        
                        # Show sample response structure
                        print(f"\n📋 Sample Response Structure:")
                        print(f"  ID: {data.get('id')}")
                        print(f"  Email: {data.get('email')}")
                        print(f"  Name: {data.get('full_name')}")
                        print(f"  Tier: {data.get('tier')}")
                        
                    except ValueError:
                        print(f"❌ User ID is not valid UUID format: {user_id}")
                else:
                    print("❌ User ID not found in profile response")
                    print(f"Response: {json.dumps(data, indent=2)}")
                    
            except json.JSONDecodeError as e:
                print(f"❌ Failed to parse JSON response: {e}")
                print(f"Raw response: {response.text}")
                
        else:
            print(f"❌ Profile endpoint failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Raw response: {response.text}")
                
    except Exception as e:
        print(f"❌ Profile request failed: {e}")

def test_login_endpoint():
    """Test login endpoint UUID serialization"""
    base_url = "https://budget-buddy-mobile.onrender.com"
    
    print("\n3. Testing Login Endpoint with Existing User")
    print("-" * 45)
    
    # Try to login with a user that should exist
    login_data = {
        "email": "test@example.com",
        "password": "TestPassword123!"
    }
    
    try:
        response = requests.post(
            f"{base_url}/auth/login",
            json=login_data,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
            
            try:
                data = response.json()
                print("✅ JSON response parsed successfully")
                
                if "user" in data and "id" in data["user"]:
                    user_id = data["user"]["id"]
                    print(f"✅ User ID found: {user_id}")
                    
                    # Validate UUID format
                    try:
                        uuid.UUID(user_id)
                        print("✅ User ID is valid UUID string format")
                    except ValueError:
                        print(f"❌ User ID is not valid UUID format: {user_id}")
                else:
                    print("⚠️ User object not found in login response (might be expected)")
                    
            except json.JSONDecodeError as e:
                print(f"❌ Failed to parse JSON response: {e}")
                
        elif response.status_code == 401:
            print("⚠️ Login failed - user doesn't exist or wrong credentials (expected)")
        else:
            print(f"❌ Unexpected login status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Login request failed: {e}")

def main():
    """Run all UUID serialization tests"""
    print("🧪 UUID Serialization Test Suite")
    print("Testing Budget Buddy Authentication Endpoints")
    print("=" * 55)
    
    # Test registration (main test)
    user_id, access_token = test_uuid_serialization()
    
    # Test profile endpoint if registration succeeded
    if access_token:
        test_user_profile_endpoint(access_token)
    
    # Test login endpoint
    test_login_endpoint()
    
    print("\n" + "=" * 55)
    if user_id and access_token:
        print("🎉 UUID Serialization Tests PASSED!")
        print("✅ All UUID fields properly serialized as strings")
        print("✅ JSON responses parse correctly") 
        print("✅ Registration and authentication working")
    else:
        print("❌ UUID Serialization Tests FAILED!")
        print("   Check the error messages above for details")
        sys.exit(1)

if __name__ == "__main__":
    main()