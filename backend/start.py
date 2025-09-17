#!/usr/bin/env python3
"""
Development server startup script for Budget Buddy Backend
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is 3.8+"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        sys.exit(1)
    print(f"✅ Python {sys.version.split()[0]} detected")

def check_venv():
    """Check if virtual environment is activated"""
    if sys.prefix == sys.base_prefix:
        print("⚠️  Warning: No virtual environment detected")
        print("It's recommended to use a virtual environment:")
        print("python -m venv venv")
        print("source venv/bin/activate  # On Windows: venv\\Scripts\\activate")
    else:
        print("✅ Virtual environment active")

def install_dependencies():
    """Install Python dependencies"""
    print("\n📦 Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        sys.exit(1)

def create_env_file():
    """Create .env file from template if it doesn't exist"""
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if not env_file.exists() and env_example.exists():
        print("\n📝 Creating .env file from template...")
        env_file.write_text(env_example.read_text())
        print("✅ .env file created - please update with your settings")
    elif env_file.exists():
        print("✅ .env file exists")
    else:
        print("⚠️  No .env or .env.example file found")

def start_server():
    """Start the FastAPI development server"""
    print("\n🚀 Starting Budget Buddy Backend...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📚 API documentation: http://localhost:8000/docs")
    print("🛑 Press Ctrl+C to stop the server\n")
    
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn",
            "main:app",
            "--reload",
            "--host", "0.0.0.0",
            "--port", "8000"
        ])
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
    except FileNotFoundError:
        print("❌ uvicorn not found. Installing...")
        install_dependencies()
        start_server()

def main():
    """Main startup function"""
    print("🎯 Budget Buddy Mobile - Backend Server Setup\n")
    
    check_python_version()
    check_venv()
    install_dependencies()
    create_env_file()
    start_server()

if __name__ == "__main__":
    main()