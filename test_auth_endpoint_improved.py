#!/usr/bin/env python3
"""
Test the improved authentication endpoint after security hardening
"""
import requests
import json

def test_improved_auth_endpoint():
    """Test various password scenarios with the improved endpoint"""
    base_url = "https://budget-buddy-mobile.onrender.com"
    
    print("🔐 Testing Improved Authentication Security")
    print("=" * 50)
    
    test_cases = [
        {
            "name": "Short Password (should be rejected)",
            "email": "test1@example.com",
            "password": "short",
            "expected_status": 400
        },
        {
            "name": "Empty Password (should be rejected)",
            "email": "test2@example.com", 
            "password": "",
            "expected_status": 400
        },
        {
            "name": "Very Long Password (should be rejected)",
            "email": "test3@example.com",
            "password": "a" * 100,  # >72 bytes
            "expected_status": 400
        },
        {
            "name": "Unicode Long Password (should be rejected)",
            "email": "test4@example.com",
            "password": "🔐" * 25,  # >72 bytes in UTF-8
            "expected_status": 400
        },
        {
            "name": "Valid Password (should succeed)", 
            "email": "test5@example.com",
            "password": "ValidPass123!",
            "expected_status": 200
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. {test_case['name']}")
        print("-" * 40)
        
        payload = {
            "email": test_case["email"],
            "password": test_case["password"],
            "full_name": "Test User"
        }
        
        try:
            response = requests.post(
                f"{base_url}/auth/register",
                json=payload,
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == test_case["expected_status"]:
                print("✅ Expected status code - TEST PASSED")
            else:
                print(f"❌ Expected {test_case['expected_status']}, got {response.status_code}")
            
            # Print response details
            try:
                response_data = response.json()
                if "detail" in response_data:
                    print(f"Error Message: {response_data['detail']}")
                elif "access_token" in response_data:
                    print("✅ Registration successful - received access token")
                else:
                    print(f"Response: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response Text: {response.text[:200]}...")
                
        except Exception as e:
            print(f"❌ Request failed: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Authentication Security Testing Complete!")

if __name__ == "__main__":
    test_improved_auth_endpoint()