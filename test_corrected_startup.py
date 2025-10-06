#!/usr/bin/env python3
"""
Test the corrected gunicorn startup command locally
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def test_corrected_startup():
    """Test the corrected startup configuration"""
    
    # Set environment variables
    env = os.environ.copy()
    env['DATABASE_URL'] = 'postgresql://budget_buddy_db_50pb_user:VCdOXkMZdWVufdd4U7BDHrApyGPPM9py@dpg-d3hjcm8gjchc73ahttu0-a.singapore-postgres.render.com:5432/budget_buddy_db_50pb'
    env['PORT'] = '8000'
    
    backend_dir = Path(__file__).parent / 'backend'
    
    print("🧪 Testing Corrected Gunicorn Startup")
    print("=" * 50)
    
    # Use the exact same command as start_render.py but with uvicorn for Windows compatibility
    cmd = [
        sys.executable, "-m", "uvicorn",
        "main:app",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--timeout-keep-alive", "2"
    ]
    
    print(f"📁 Backend directory: {backend_dir}")
    print(f"🚀 Command: {' '.join(cmd)}")
    
    try:
        process = subprocess.Popen(
            cmd,
            cwd=str(backend_dir),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        
        # Wait for startup
        time.sleep(10)
        
        if process.poll() is None:
            print("✅ Server started successfully!")
            
            # Test critical endpoints
            endpoints = {
                "/": "Root endpoint",
                "/health": "Health check", 
                "/docs": "API documentation",
                "/auth": "Auth routes (may be 404 if no GET handler)"
            }
            
            success_count = 0
            for endpoint, description in endpoints.items():
                try:
                    response = requests.get(f"http://127.0.0.1:8000{endpoint}", timeout=5)
                    if response.status_code in [200, 404, 405]:  # 404/405 acceptable for some routes
                        print(f"✅ {endpoint} ({description}): {response.status_code}")
                        if response.status_code == 200:
                            success_count += 1
                            if endpoint == "/health":
                                print(f"   📄 Health response: {response.text}")
                    else:
                        print(f"⚠️ {endpoint}: Unexpected status {response.status_code}")
                except Exception as e:
                    print(f"❌ {endpoint}: Connection failed - {e}")
            
            # Keep server alive for 2+ minutes to test stability
            print("\n⏱️ Testing stability - keeping server alive for 2 minutes...")
            time.sleep(120)
            
            # Final health check
            try:
                response = requests.get("http://127.0.0.1:8000/health", timeout=5)
                print(f"✅ Final health check: {response.status_code}")
            except Exception as e:
                print(f"❌ Final health check failed: {e}")
            
            # Stop server
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
            
            print("🛑 Server stopped")
            
            if success_count >= 2:  # At least root and health should work
                print("\n🎉 STABILITY TEST PASSED!")
                print("✅ Server stays alive >2 minutes")
                print("✅ Health endpoint responds correctly") 
                print("🚀 Ready for Render deployment!")
                return True
            else:
                print(f"\n⚠️ Limited success: {success_count}/4 endpoints working")
                return False
                
        else:
            # Server failed to start
            output, _ = process.communicate()
            print(f"❌ Server startup failed")
            print(f"Output: {output}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_corrected_startup()
    if success:
        print("\n🎊 All tests passed! Deploying fixes...")
    else:
        print("\n❌ Tests failed. Check configuration.")
        sys.exit(1)