#!/usr/bin/env python3
"""
Windows-compatible local test using uvicorn directly
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def test_windows_startup():
    """Test startup on Windows using uvicorn directly"""
    
    # Set environment
    env = os.environ.copy()
    env['DATABASE_URL'] = 'postgresql://budget_buddy_db_50pb_user:VCdOXkMZdWVufdd4U7BDHrApyGPPM9py@dpg-d3hjcm8gjchc73ahttu0-a.singapore-postgres.render.com:5432/budget_buddy_db_50pb'
    
    backend_dir = Path(__file__).parent / 'backend'
    
    print("🧪 Testing Windows-compatible startup")
    print(f"📁 Backend directory: {backend_dir}")
    
    try:
        # Start uvicorn directly
        cmd = [
            sys.executable, "-m", "uvicorn", 
            "main:app", 
            "--host", "127.0.0.1", 
            "--port", "8000"
        ]
        
        print(f"🚀 Running: {' '.join(cmd)}")
        
        process = subprocess.Popen(
            cmd,
            cwd=str(backend_dir),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        
        # Give it time to start
        time.sleep(8)
        
        if process.poll() is None:
            print("✅ Server started successfully!")
            
            # Test endpoints
            endpoints = ["/", "/health", "/health/detailed", "/docs"]
            
            for endpoint in endpoints:
                try:
                    response = requests.get(f"http://127.0.0.1:8000{endpoint}", timeout=5)
                    print(f"✅ {endpoint}: {response.status_code}")
                    if endpoint == "/health":
                        print(f"   📄 Content: {response.text}")
                except Exception as e:
                    print(f"❌ {endpoint}: {e}")
            
            # Stop server
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                
            print("🛑 Server stopped")
            return True
        else:
            # Get error output
            output, _ = process.communicate()
            print(f"❌ Server failed to start")
            print(f"Output: {output}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_windows_startup()
    if success:
        print("\n🎉 Windows test passed! FastAPI routes are working.")
        print("💡 The Render deployment should work (gunicorn works on Linux)")
    else:
        print("\n❌ Windows test failed. There might be issues with the FastAPI app.")
        sys.exit(1)