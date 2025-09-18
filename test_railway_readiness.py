#!/usr/bin/env python3
"""
Railway Deployment Readiness Test
Checks if backend is ready for Railway deployment
"""

import os
import sys
from pathlib import Path

def print_status(check_name, status, message=""):
    """Print formatted status"""
    status_icon = "✅" if status else "❌"
    print(f"{status_icon} {check_name}")
    if message:
        print(f"   {message}")

def check_file_exists(file_path, description):
    """Check if required file exists"""
    path = Path(file_path)
    exists = path.exists()
    print_status(f"{description}: {file_path}", exists)
    return exists

def check_backend_structure():
    """Check backend directory structure"""
    print("\n🔍 Checking Backend Structure:")
    
    required_files = [
        ("backend/main.py", "FastAPI main application"),
        ("backend/requirements.txt", "Python dependencies"),
        ("backend/Dockerfile", "Docker configuration"),
        ("backend/railway.json", "Railway configuration"),
        ("backend/.env.production.example", "Production environment template")
    ]
    
    all_good = True
    for file_path, description in required_files:
        if not check_file_exists(file_path, description):
            all_good = False
    
    return all_good

def check_requirements_txt():
    """Check requirements.txt content"""
    print("\n📦 Checking Requirements:")
    
    req_file = Path("backend/requirements.txt")
    if not req_file.exists():
        print_status("requirements.txt", False, "File missing")
        return False
    
    content = req_file.read_text(encoding='utf-8')
    required_packages = [
        "fastapi",
        "uvicorn",
        "sqlalchemy", 
        "psycopg2-binary",
        "python-jose",
        "passlib"
    ]
    
    all_good = True
    for package in required_packages:
        if package in content:
            print_status(f"Package {package}", True)
        else:
            print_status(f"Package {package}", False, "Missing")
            all_good = False
    
    return all_good

def check_environment_variables():
    """Check environment variable configuration"""
    print("\n🔧 Checking Environment Configuration:")
    
    env_example = Path("backend/.env.production.example")
    if env_example.exists():
        content = env_example.read_text(encoding='utf-8')
        required_vars = [
            "SECRET_KEY",
            "COHERE_API_KEY", 
            "DATABASE_URL",
            "ENVIRONMENT"
        ]
        
        all_good = True
        for var in required_vars:
            if var in content:
                print_status(f"Environment variable {var}", True)
            else:
                print_status(f"Environment variable {var}", False, "Not documented")
                all_good = False
        
        return all_good
    else:
        print_status("Environment template", False, "Missing .env.production.example")
        return False

def check_docker_config():
    """Check Docker configuration"""
    print("\n🐳 Checking Docker Configuration:")
    
    dockerfile = Path("backend/Dockerfile")
    if not dockerfile.exists():
        print_status("Dockerfile", False, "Missing")
        return False
    
    content = dockerfile.read_text(encoding='utf-8')
    
    checks = [
        ("FROM python", "Python base image"),
        ("COPY requirements.txt", "Requirements copy"),
        ("pip install", "Dependencies installation"),
        ("EXPOSE", "Port exposure"),
        ("uvicorn", "Server startup")
    ]
    
    all_good = True
    for check, description in checks:
        if check.lower() in content.lower():
            print_status(description, True)
        else:
            print_status(description, False, f"Missing: {check}")
            all_good = False
    
    return all_good

def check_railway_config():
    """Check Railway-specific configuration"""
    print("\n🚂 Checking Railway Configuration:")
    
    railway_json = Path("backend/railway.json")
    if railway_json.exists():
        print_status("Railway configuration", True)
        return True
    else:
        print_status("Railway configuration", False, "Missing railway.json")
        return False

def main():
    """Main test function"""
    print("🎯 Railway Deployment Readiness Test")
    print("=" * 50)
    
    checks = [
        ("Backend Structure", check_backend_structure),
        ("Requirements", check_requirements_txt),
        ("Environment Variables", check_environment_variables),
        ("Docker Configuration", check_docker_config),
        ("Railway Configuration", check_railway_config)
    ]
    
    all_passed = True
    
    for check_name, check_func in checks:
        if not check_func():
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All checks passed! Ready for Railway deployment")
        print("\nNext steps:")
        print("1. Commit all changes to GitHub")
        print("2. Run: python deploy_production.py")
        print("3. Or deploy via Railway Dashboard")
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        print("\nCommon fixes:")
        print("- Ensure all required files are in the backend/ directory")
        print("- Check requirements.txt includes all dependencies")
        print("- Verify Dockerfile follows Railway requirements")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)