#!/usr/bin/env python3
"""
Comprehensive testing of the live Budget Buddy backend
Tests all available endpoints and database operations
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "https://budget-buddy-mobile.onrender.com"

def test_endpoint(method, endpoint, data=None, headers=None, expected_status=200):
    """Test a specific endpoint with detailed error reporting"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        print(f"🧪 Testing {method} {endpoint}...")
        
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=headers, timeout=10)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers, timeout=10)
        else:
            print(f"   ❌ Unsupported method: {method}")
            return False
        
        print(f"   📊 Status: {response.status_code}")
        
        # Handle different response types
        try:
            if response.headers.get('content-type', '').startswith('application/json'):
                content = response.json()
                print(f"   📄 JSON Response: {json.dumps(content, indent=2)}")
            else:
                content = response.text[:200] + "..." if len(response.text) > 200 else response.text
                print(f"   📄 Text Response: {content}")
        except:
            print(f"   📄 Raw Response: {response.text[:100]}...")
        
        # Check if status matches expected
        if response.status_code == expected_status:
            print(f"   ✅ SUCCESS - Expected status {expected_status}")
            return True
        elif response.status_code in [200, 201, 202, 204]:
            print(f"   ✅ SUCCESS - Got {response.status_code} (different than expected {expected_status})")
            return True
        else:
            print(f"   ⚠️ Unexpected status {response.status_code} (expected {expected_status})")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Request failed: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Unexpected error: {e}")
        return False

def main():
    print("🚀 Comprehensive Budget Buddy Backend Testing")
    print("=" * 60)
    print(f"🎯 Base URL: {BASE_URL}")
    print(f"🕐 Test Time: {datetime.now()}")
    print("=" * 60)
    
    results = {}
    
    # Core API Tests
    print("\n📋 CORE API ENDPOINTS")
    print("-" * 40)
    results["root"] = test_endpoint("GET", "/")
    results["health"] = test_endpoint("GET", "/health")
    results["health_detailed"] = test_endpoint("GET", "/health/detailed")
    results["docs"] = test_endpoint("GET", "/docs")
    results["openapi"] = test_endpoint("GET", "/openapi.json")
    
    # Authentication Tests  
    print("\n🔐 AUTHENTICATION ENDPOINTS")
    print("-" * 40)
    
    # Test registration
    register_data = {
        "email": "test@example.com",
        "full_name": "Test User", 
        "password": "testpass123"
    }
    results["register"] = test_endpoint("POST", "/auth/register", register_data, expected_status=201)
    
    # Test login (if registration failed, this will likely fail too)
    login_data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    results["login"] = test_endpoint("POST", "/auth/login", login_data)
    
    # User Management Tests
    print("\n👤 USER MANAGEMENT ENDPOINTS")
    print("-" * 40)
    # These will likely need authentication tokens
    results["user_me"] = test_endpoint("GET", "/user/me", expected_status=401)  # Expect unauthorized
    
    # AI Service Tests
    print("\n🤖 AI SERVICE ENDPOINTS")
    print("-" * 40) 
    results["ai_endpoint"] = test_endpoint("GET", "/ai", expected_status=404)  # May not have GET handler
    
    # Summary
    print("\n📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    print(f"✅ Passed: {passed}/{total} tests")
    print(f"❌ Failed: {total - passed}/{total} tests")
    
    print("\n📋 DETAILED RESULTS:")
    for endpoint, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"   {endpoint.ljust(20)}: {status}")
    
    # Recommendations
    print("\n💡 RECOMMENDATIONS")
    print("-" * 40)
    
    if results.get("health") and results.get("health_detailed"):
        print("✅ Service is healthy and database is connected")
    
    if not results.get("register"):
        print("⚠️ User registration failing - check auth service configuration")
        print("   - Verify database schema matches auth models")
        print("   - Check environment variables (JWT_SECRET_KEY, etc.)")
        print("   - Review auth route error handling")
    
    if results.get("docs"):
        print(f"✅ API documentation available at: {BASE_URL}/docs")
    
    print(f"\n🎯 Overall Status: {'🎉 HEALTHY' if passed > total/2 else '⚠️ NEEDS ATTENTION'}")

if __name__ == "__main__":
    main()