#!/usr/bin/env python3
"""
Backend Gateway Script for Budget Buddy Mobile
Bridges the gap between root directory and backend subdirectory
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    """Gateway script to run the backend server"""
    
    # Get the current script directory (project root)
    project_root = Path(__file__).parent
    backend_dir = project_root / "backend"
    venv_python = project_root / ".venv" / "Scripts" / "python.exe"
    
    # Verify paths exist
    if not backend_dir.exists():
        print("❌ Backend directory not found!")
        sys.exit(1)
    
    if not venv_python.exists():
        print("❌ Virtual environment not found!")
        print("Please run: python -m venv .venv")
        sys.exit(1)
    
    main_py = backend_dir / "main.py"
    if not main_py.exists():
        print("❌ main.py not found in backend directory!")
        sys.exit(1)
    
    print("🎯 Budget Buddy Mobile - Backend Gateway")
    print(f"📂 Project Root: {project_root}")
    print(f"📂 Backend Dir: {backend_dir}")
    print(f"🐍 Python: {venv_python}")
    print(f"🚀 Starting server from backend directory...")
    print(f"📍 Server: http://localhost:8000")
    print(f"📚 Docs: http://localhost:8000/docs")
    print("🛑 Press Ctrl+C to stop\n")
    
    # Change to backend directory and run uvicorn
    os.chdir(backend_dir)
    
    try:
        subprocess.run([
            str(venv_python), "-m", "uvicorn",
            "main:app",
            "--reload",
            "--host", "0.0.0.0", 
            "--port", "8000"
        ])
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()