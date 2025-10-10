#!/usr/bin/env python3
"""
Test script to debug authentication endpoint issues
"""
import requests
import json
import time

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get("https://budget-buddy-mobile.onrender.com/health", timeout=10)
        print(f"Health Check - Status: {response.status_code}")
        print(f"Health Check - Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_registration():
    """Test user registration"""
    payload = {
        "email": "testuser@example.com",
        "password": "Test123",
        "full_name": "Test User"
    }
    
    try:
        response = requests.post(
            "https://budget-buddy-mobile.onrender.com/auth/register",
            json=payload,
            timeout=10
        )
        print(f"Registration - Status: {response.status_code}")
        print(f"Registration - Response: {response.text}")
        
        if response.status_code >= 400:
            print(f"Registration failed with {response.status_code}")
            try:
                error_detail = response.json()
                print(f"Error detail: {error_detail}")
            except:
                print("Could not parse error response as JSON")
        
        return response.status_code == 200
        
    except Exception as e:
        print(f"Registration test failed: {e}")
        return False

def test_with_different_emails():
    """Test with different email addresses"""
    test_emails = [
        ("test1@example.com", "Password123"),
        ("test2@example.com", "Short123"),
        ("test3@example.com", "A" * 60),  # Test shorter than 72 bytes
    ]
    
    for email, password in test_emails:
        print(f"\n--- Testing with {email} ---")
        payload = {
            "email": email,
            "password": password,
            "full_name": "Test User"
        }
        
        try:
            response = requests.post(
                "https://budget-buddy-mobile.onrender.com/auth/register",
                json=payload,
                timeout=10
            )
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    print("=== Budget Buddy Authentication Endpoint Test ===")
    
    # Test health first
    print("\n1. Testing Health Endpoint...")
    if not test_health():
        print("Health check failed, aborting tests")
        exit(1)
    
    print("\n2. Testing Registration Endpoint...")
    test_registration()
    
    print("\n3. Testing Multiple Registration Attempts...")
    test_with_different_emails()
    
    print("\n=== Test Complete ===")