#!/usr/bin/env python3
"""
Production Deployment Script
Automates the deployment process to Railway
"""

import os
import sys
import subprocess
import json
import requests
from pathlib import Path

def print_header(title):
    """Print formatted header"""
    print("\n" + "=" * 60)
    print(f"🎯 {title}")
    print("=" * 60)

def check_git_status():
    """Check if git repository is clean"""
    print_header("Checking Git Status")
    
    try:
        # Check if we're in a git repository
        result = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
        
        if result.stdout.strip():
            print("⚠️  Uncommitted changes detected:")
            print(result.stdout)
            response = input("Continue deployment? (y/N): ")
            if response.lower() != 'y':
                print("❌ Deployment cancelled")
                return False
        
        print("✅ Git repository is clean")
        return True
        
    except subprocess.CalledProcessError:
        print("❌ Not a git repository or git not available")
        return False

def check_railway_cli():
    """Check if Railway CLI is installed"""
    print_header("Checking Railway CLI")
    
    try:
        result = subprocess.run(["railway", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Railway CLI installed: {result.stdout.strip()}")
            return True
        else:
            print("❌ Railway CLI not found")
            print("Install with: npm install -g @railway/cli")
            return False
            
    except FileNotFoundError:
        print("❌ Railway CLI not found")
        print("Install with: npm install -g @railway/cli")
        return False

def railway_login():
    """Login to Railway if not already logged in"""
    print_header("Railway Authentication")
    
    try:
        result = subprocess.run(["railway", "whoami"], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Already logged in to Railway: {result.stdout.strip()}")
            return True
        else:
            print("🔑 Logging in to Railway...")
            subprocess.run(["railway", "login"], check=True)
            print("✅ Successfully logged in to Railway")
            return True
            
    except subprocess.CalledProcessError:
        print("❌ Railway login failed")
        return False

def create_railway_project():
    """Create or connect to Railway project"""
    print_header("Railway Project Setup")
    
    try:
        # Check if project already exists
        result = subprocess.run(["railway", "status"], capture_output=True, text=True)
        
        if "No project found" in result.stderr or result.returncode != 0:
            print("📦 Creating new Railway project...")
            subprocess.run(["railway", "init"], check=True)
            print("✅ Railway project created")
        else:
            print("✅ Connected to existing Railway project")
        
        return True
        
    except subprocess.CalledProcessError:
        print("❌ Failed to setup Railway project")
        return False

def setup_postgresql():
    """Add PostgreSQL service to Railway project"""
    print_header("Database Setup")
    
    try:
        print("🗄️  Adding PostgreSQL database...")
        subprocess.run(["railway", "add", "--database", "postgresql"], check=True)
        print("✅ PostgreSQL database added")
        
        print("⏳ Waiting for database to initialize...")
        import time
        time.sleep(10)  # Give database time to initialize
        
        return True
        
    except subprocess.CalledProcessError:
        print("⚠️  Database might already exist or failed to add")
        return True  # Continue deployment even if database setup fails

def set_environment_variables():
    """Set required environment variables"""
    print_header("Environment Variables")
    
    # Required variables
    required_vars = {
        "SECRET_KEY": "JWT secret key (generate with: openssl rand -hex 32)",
        "COHERE_API_KEY": "Your Cohere AI API key",
        "ENVIRONMENT": "production"
    }
    
    for var, description in required_vars.items():
        try:
            current_value = subprocess.run(
                ["railway", "variables", "get", var], 
                capture_output=True, text=True
            )
            
            if current_value.returncode == 0 and current_value.stdout.strip():
                print(f"✅ {var} already set")
            else:
                print(f"Setting {var}: {description}")
                value = input(f"Enter {var}: ").strip()
                
                if value:
                    subprocess.run(["railway", "variables", "set", f"{var}={value}"], check=True)
                    print(f"✅ {var} set successfully")
                else:
                    print(f"⚠️  Skipped {var}")
                    
        except subprocess.CalledProcessError:
            print(f"❌ Failed to set {var}")
    
    return True

def deploy_to_railway():
    """Deploy the application to Railway"""
    print_header("Deploying to Railway")
    
    try:
        print("🚀 Starting deployment...")
        
        # Deploy the application
        subprocess.run(["railway", "up"], check=True)
        
        print("✅ Deployment successful!")
        
        # Get the deployment URL
        result = subprocess.run(["railway", "domain"], capture_output=True, text=True)
        if result.returncode == 0:
            domain = result.stdout.strip()
            print(f"🌐 Your app is live at: https://{domain}")
            return domain
        else:
            print("⚠️  Couldn't retrieve domain, check Railway dashboard")
            return None
            
    except subprocess.CalledProcessError:
        print("❌ Deployment failed")
        return None

def test_deployment(domain):
    """Test the deployed application"""
    if not domain:
        return False
    
    print_header("Testing Deployment")
    
    try:
        url = f"https://{domain}/health"
        print(f"🔍 Testing health endpoint: {url}")
        
        response = requests.get(url, timeout=30)
        
        if response.status_code == 200:
            print("✅ Health check passed!")
            print(f"📚 API documentation available at: https://{domain}/docs")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
            
    except requests.RequestException as e:
        print(f"❌ Failed to test deployment: {e}")
        return False

def update_frontend_config(domain):
    """Generate frontend configuration for production"""
    if not domain:
        return
    
    print_header("Frontend Configuration")
    
    frontend_config = f"""
# Production Backend Configuration
# Add these to your .env.local file:

EXPO_PUBLIC_BACKEND_URL=https://{domain}
EXPO_PUBLIC_API_MODE=backend
EXPO_PUBLIC_ENABLE_HYBRID_AI=true
EXPO_PUBLIC_ENABLE_BACKEND_AUTH=true

# Test the production backend:
# curl https://{domain}/health
# Visit: https://{domain}/docs
"""
    
    print("📱 Frontend configuration:")
    print(frontend_config)
    
    # Write to file
    config_file = Path("PRODUCTION_CONFIG.txt")
    config_file.write_text(frontend_config)
    print(f"✅ Configuration saved to {config_file}")

def main():
    """Main deployment function"""
    print("🎯 Budget Buddy Backend - Production Deployment")
    print("Deploying to Railway Platform")
    
    # Pre-deployment checks
    if not check_git_status():
        sys.exit(1)
    
    if not check_railway_cli():
        sys.exit(1)
    
    if not railway_login():
        sys.exit(1)
    
    # Railway setup
    if not create_railway_project():
        sys.exit(1)
    
    setup_postgresql()
    set_environment_variables()
    
    # Deploy
    domain = deploy_to_railway()
    
    if domain:
        test_deployment(domain)
        update_frontend_config(domain)
        
        print("\n🎉 Deployment Complete!")
        print(f"🌐 Backend URL: https://{domain}")
        print(f"📚 API Docs: https://{domain}/docs")
        print("📱 Update your React Native app with the new backend URL")
    else:
        print("\n❌ Deployment failed. Check Railway dashboard for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()