#!/usr/bin/env python3
"""
Test all Render endpoints to identify what's working
"""

import requests
import time
import json

BASE_URL = "https://budget-buddy-backend-6q8z.onrender.com"

def test_endpoint(endpoint, method="GET", timeout=10):
    """Test a specific endpoint"""
    url = f"{BASE_URL}{endpoint}"
    try:
        print(f"🧪 Testing {method} {endpoint}...")
        response = requests.request(method, url, timeout=timeout)
        
        print(f"   ✅ Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                content = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                print(f"   📄 Content: {content}")
            except:
                print(f"   📄 Content: {response.text[:200]}...")
        
        return response.status_code
        
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Error: {e}")
        return None

def main():
    print("🚀 Comprehensive Render Endpoint Testing")
    print("=" * 50)
    
    # Test various endpoints that should exist
    endpoints_to_test = [
        "/",
        "/health", 
        "/health/detailed",
        "/docs",
        "/openapi.json",
        "/auth/register",
        "/auth/login",
        "/users/me"
    ]
    
    results = {}
    
    for endpoint in endpoints_to_test:
        status = test_endpoint(endpoint)
        results[endpoint] = status
        time.sleep(1)  # Small delay between requests
        print()
    
    print("📊 SUMMARY")
    print("=" * 50)
    for endpoint, status in results.items():
        if status == 200:
            print(f"✅ {endpoint}: Working ({status})")
        elif status == 404:
            print(f"❌ {endpoint}: Not Found ({status})")
        elif status:
            print(f"⚠️ {endpoint}: Status {status}")
        else:
            print(f"💥 {endpoint}: Connection Failed")

if __name__ == "__main__":
    main()