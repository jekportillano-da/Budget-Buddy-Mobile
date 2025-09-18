#!/usr/bin/env python3
"""
Backend API Testing Script for Budget Buddy Mobile
Tests all endpoints systematically to ensure functionality
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_endpoint(method, endpoint, data=None, headers=None, auth_token=None):
    """Test a single endpoint"""
    url = f"{BASE_URL}{endpoint}"
    
    # Add authorization header if token provided
    if auth_token:
        if headers is None:
            headers = {}
        headers["Authorization"] = f"Bearer {auth_token}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers)
        
        print(f"✅ {method.upper()} {endpoint}")
        print(f"   Status: {response.status_code}")
        if response.status_code < 400:
            try:
                result = response.json()
                print(f"   Response: {json.dumps(result, indent=2)[:200]}...")
            except:
                print(f"   Response: {response.text[:100]}...")
        else:
            print(f"   Error: {response.text}")
        print()
        return response
        
    except Exception as e:
        print(f"❌ {method.upper()} {endpoint}")
        print(f"   Error: {str(e)}")
        print()
        return None

def main():
    """Run all API tests"""
    print("🧪 Budget Buddy Backend API Testing")
    print("=" * 50)
    
    # Test 1: Health checks
    print("1️⃣ HEALTH CHECKS")
    test_endpoint("GET", "/")
    test_endpoint("GET", "/health")
    
    # Test 2: Authentication flow
    print("2️⃣ AUTHENTICATION FLOW")
    
    # Register a test user
    register_data = {
        "email": "test@example.com",
        "password": "Test123!@#",
        "full_name": "Test User"
    }
    
    register_response = test_endpoint("POST", "/auth/register", register_data)
    
    # Extract token for authenticated requests
    auth_token = None
    if register_response and register_response.status_code in [200, 201]:
        try:
            auth_token = register_response.json().get("access_token")
        except:
            pass
    
    # If registration failed (user exists), try login
    if not auth_token:
        login_data = {
            "email": "test@example.com",
            "password": "Test123!@#"
        }
        login_response = test_endpoint("POST", "/auth/login", login_data)
        if login_response and login_response.status_code == 200:
            try:
                auth_token = login_response.json().get("access_token")
            except:
                pass
    
    # Test authenticated endpoints
    if auth_token:
        print("3️⃣ AUTHENTICATED ENDPOINTS")
        test_endpoint("GET", "/auth/me", auth_token=auth_token)
        test_endpoint("GET", "/auth/tier", auth_token=auth_token)
        
        # Test AI endpoints
        print("4️⃣ AI SERVICES")
        chat_data = {
            "message": "What is 2+2?",
            "context": "budget"
        }
        test_endpoint("POST", "/ai/chat", chat_data, auth_token=auth_token)
        
        test_endpoint("GET", "/ai/usage", auth_token=auth_token)
    else:
        print("⚠️  Could not obtain auth token - skipping authenticated tests")
    
    print("✅ Testing complete!")

if __name__ == "__main__":
    main()