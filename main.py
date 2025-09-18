# Railway deployment entry point
# This file tells Railway this is a Python project
import subprocess
import sys
import os

# Change to backend directory and start the server
os.chdir('backend')
subprocess.run([sys.executable, '-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'])