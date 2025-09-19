"""
Debug script to check Railway PORT environment variable
"""
import os

print("=== PORT DEBUG ===")
print(f"PORT environment variable: {os.getenv('PORT', 'NOT SET')}")
print(f"All environment variables with 'PORT' in name:")
for key, value in os.environ.items():
    if 'PORT' in key.upper():
        print(f"  {key} = {value}")

print("\n=== UVICORN COMMAND TEST ===")
port = os.getenv('PORT', '8080')
print(f"Uvicorn would start on port: {port}")
print(f"Command would be: uvicorn main:app --host 0.0.0.0 --port {port}")