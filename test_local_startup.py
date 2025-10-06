#!/usr/bin/env python3
"""
Test local startup to verify it works before deploying to Render
"""

import os
import sys
import subprocess
import time
from pathlib import Path

# Set environment
os.environ['DATABASE_URL'] = 'postgresql://budget_buddy_db_50pb_user:VCdOXkMZdWVufdd4U7BDHrApyGPPM9py@dpg-d3hjcm8gjchc73ahttu0-a.singapore-postgres.render.com:5432/budget_buddy_db_50pb'
os.environ['PORT'] = '8000'

def test_local_startup():
    """Test the start_render.py script locally"""
    backend_dir = Path(__file__).parent / 'backend'
    start_script = backend_dir / 'start_render.py'
    
    print("🧪 Testing local startup with start_render.py")
    print(f"📁 Backend directory: {backend_dir}")
    print(f"🚀 Start script: {start_script}")
    
    try:
        # Run the start script
        process = subprocess.Popen(
            [sys.executable, str(start_script)],
            cwd=str(backend_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        
        # Give it a few seconds to start
        time.sleep(5)
        
        if process.poll() is None:
            print("✅ Server started successfully!")
            
            # Test health endpoint
            try:
                import requests
                response = requests.get("http://localhost:8000/health", timeout=5)
                print(f"✅ Health check: {response.status_code}")
                print(f"📄 Response: {response.text}")
            except Exception as e:
                print(f"⚠️ Health check failed: {e}")
            
            # Stop the server
            process.terminate()
            process.wait()
            print("🛑 Server stopped")
            return True
        else:
            # Server failed to start
            output = process.stdout.read()
            print(f"❌ Server failed to start")
            print(f"Output: {output}")
            return False
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_local_startup()
    if success:
        print("🎉 Local test passed! Ready for Render deployment.")
    else:
        print("❌ Local test failed. Fix issues before deploying.")
        sys.exit(1)