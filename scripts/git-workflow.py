#!/usr/bin/env python3
"""
Budget Buddy Mobile - Git Workflow Helper
Simplifies common Git operations following our branching strategy
"""

import subprocess
import sys
import os
from datetime import datetime

def run_command(command, check=True):
    """Run a shell command and return the result"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, check=check)
        return result.stdout.strip(), result.stderr.strip()
    except subprocess.CalledProcessError as e:
        return None, e.stderr.strip()

def get_current_branch():
    """Get the current Git branch"""
    stdout, _ = run_command("git branch --show-current")
    return stdout if stdout else "unknown"

def get_branch_status():
    """Get the status of all branches"""
    print("🌳 Branch Status:")
    print("=" * 50)
    
    # Get current branch
    current = get_current_branch()
    print(f"📍 Current branch: {current}")
    
    # List all branches
    stdout, _ = run_command("git branch -a")
    if stdout:
        branches = [line.strip().replace("* ", "").replace("remotes/origin/", "") 
                   for line in stdout.split('\n') if line.strip()]
        
        local_branches = [b for b in branches if not b.startswith('remotes/')]
        
        print(f"\n🏠 Local branches:")
        for branch in set(local_branches):
            if branch == current:
                print(f"  ✅ {branch} (current)")
            else:
                print(f"  📂 {branch}")
    
    # Check if there are uncommitted changes
    stdout, _ = run_command("git status --porcelain")
    if stdout:
        print(f"\n⚠️  Uncommitted changes detected:")
        for line in stdout.split('\n'):
            if line.strip():
                print(f"  📝 {line}")
    else:
        print(f"\n✅ Working directory clean")

def create_feature_branch():
    """Create a new feature branch"""
    print("🔧 Create Feature Branch")
    print("=" * 30)
    
    # Check if on dev branch
    current = get_current_branch()
    if current != "dev":
        print("⚠️  Not on dev branch. Switching to dev first...")
        stdout, stderr = run_command("git checkout dev")
        if stderr:
            print(f"❌ Error switching to dev: {stderr}")
            return
        
        # Pull latest changes
        print("📥 Pulling latest changes from dev...")
        run_command("git pull origin dev")
    
    # Get feature name
    feature_name = input("\n🏷️  Enter feature name (e.g., 'user-profile-page'): ").strip()
    if not feature_name:
        print("❌ Feature name is required!")
        return
    
    # Create feature branch
    branch_name = f"feature/{feature_name}"
    stdout, stderr = run_command(f"git checkout -b {branch_name}")
    
    if stderr and "fatal" in stderr:
        print(f"❌ Error creating branch: {stderr}")
        return
    
    print(f"✅ Created and switched to branch: {branch_name}")
    
    # Push to remote
    push_remote = input("\n🚀 Push to remote immediately? (y/N): ").strip().lower()
    if push_remote == 'y':
        stdout, stderr = run_command(f"git push -u origin {branch_name}")
        if stderr and "fatal" not in stderr:
            print(f"✅ Branch pushed to remote: origin/{branch_name}")
        else:
            print(f"⚠️  Branch created locally. Push later with: git push -u origin {branch_name}")

def create_hotfix_branch():
    """Create a new hotfix branch"""
    print("🚨 Create Hotfix Branch")
    print("=" * 25)
    
    # Check if on main branch
    current = get_current_branch()
    if current != "main":
        print("⚠️  Not on main branch. Switching to main first...")
        stdout, stderr = run_command("git checkout main")
        if stderr:
            print(f"❌ Error switching to main: {stderr}")
            return
        
        # Pull latest changes
        print("📥 Pulling latest changes from main...")
        run_command("git pull origin main")
    
    # Get hotfix name
    hotfix_name = input("\n🏷️  Enter hotfix name (e.g., 'security-patch'): ").strip()
    if not hotfix_name:
        print("❌ Hotfix name is required!")
        return
    
    # Create hotfix branch
    branch_name = f"hotfix/{hotfix_name}"
    stdout, stderr = run_command(f"git checkout -b {branch_name}")
    
    if stderr and "fatal" in stderr:
        print(f"❌ Error creating branch: {stderr}")
        return
    
    print(f"✅ Created and switched to branch: {branch_name}")
    print(f"⚠️  Remember: Hotfix branches should be merged to both main AND dev!")

def commit_with_convention():
    """Commit with semantic versioning convention"""
    print("📝 Semantic Commit")
    print("=" * 20)
    
    # Check for changes
    stdout, _ = run_command("git status --porcelain")
    if not stdout:
        print("✅ No changes to commit!")
        return
    
    print("📋 Available commit types:")
    types = [
        "feat - New feature",
        "fix - Bug fix", 
        "docs - Documentation changes",
        "style - Code style changes",
        "refactor - Code refactoring",
        "test - Test additions/modifications",
        "chore - Build process or auxiliary tool changes",
        "security - Security improvements",
        "perf - Performance improvements"
    ]
    
    for i, t in enumerate(types, 1):
        print(f"  {i}. {t}")
    
    # Get commit type
    type_choice = input("\n🏷️  Select commit type (1-9): ").strip()
    try:
        type_index = int(type_choice) - 1
        if 0 <= type_index < len(types):
            commit_type = types[type_index].split(" - ")[0]
        else:
            print("❌ Invalid choice!")
            return
    except ValueError:
        print("❌ Please enter a number!")
        return
    
    # Get scope (optional)
    scope = input("🎯 Enter scope (optional, e.g., 'auth', 'ledger'): ").strip()
    
    # Get description
    description = input("📄 Enter commit description: ").strip()
    if not description:
        print("❌ Description is required!")
        return
    
    # Build commit message
    if scope:
        commit_msg = f"{commit_type}({scope}): {description}"
    else:
        commit_msg = f"{commit_type}: {description}"
    
    print(f"\n📝 Commit message: {commit_msg}")
    confirm = input("✅ Confirm commit? (Y/n): ").strip().lower()
    
    if confirm != 'n':
        # Add all changes
        run_command("git add .")
        
        # Commit
        stdout, stderr = run_command(f'git commit -m "{commit_msg}"')
        if stderr and "fatal" not in stderr:
            print(f"✅ Committed successfully!")
            
            # Ask about push
            push_now = input("🚀 Push to remote? (y/N): ").strip().lower()
            if push_now == 'y':
                current_branch = get_current_branch()
                run_command(f"git push origin {current_branch}")
                print(f"✅ Pushed to origin/{current_branch}")
        else:
            print(f"❌ Commit failed: {stderr}")

def show_workflow_summary():
    """Show workflow summary"""
    print("🚀 Budget Buddy Mobile - Git Workflow")
    print("=" * 45)
    print("""
🌳 Branch Structure:
   main     (🚀 Production - Auto-deploys to Render)
   ├── staging  (🧪 Pre-production testing)
   └── dev      (🛠️ Active development)
       ├── feature/* (🔧 New features)
       └── hotfix/*  (🚨 Critical fixes)

🔄 Workflow:
   1. Create feature branch from dev
   2. Develop and commit changes
   3. Push and create PR to dev
   4. Merge to dev → staging → main

📝 Commit Convention:
   type(scope): description
   Examples:
   - feat(auth): add tier synchronization
   - fix(ledger): resolve display issue
   - docs(readme): update installation guide
    """)

def main():
    """Main menu"""
    while True:
        print("\n" + "="*50)
        print("🚀 Budget Buddy Mobile - Git Workflow Helper")
        print("="*50)
        
        get_branch_status()
        
        print(f"\n📋 Available Actions:")
        print("1. 🔧 Create feature branch")
        print("2. 🚨 Create hotfix branch") 
        print("3. 📝 Semantic commit")
        print("4. 🌳 Show workflow summary")
        print("5. 🔄 Refresh status")
        print("0. 🚪 Exit")
        
        choice = input(f"\n🎯 Select action (0-5): ").strip()
        
        if choice == "1":
            create_feature_branch()
        elif choice == "2":
            create_hotfix_branch()
        elif choice == "3":
            commit_with_convention()
        elif choice == "4":
            show_workflow_summary()
        elif choice == "5":
            continue  # Refresh by relooping
        elif choice == "0":
            print("👋 Happy coding!")
            break
        else:
            print("❌ Invalid choice! Please select 0-5.")

if __name__ == "__main__":
    try:
        # Check if we're in a git repository
        run_command("git status")
        main()
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Make sure you're in a Git repository!")