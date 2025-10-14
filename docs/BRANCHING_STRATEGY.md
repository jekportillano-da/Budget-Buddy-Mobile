# 🌳 Git Branching Strategy - Budget Buddy Mobile

## 📋 Branch Structure Overview

We follow a **GitFlow-inspired** branching strategy optimized for continuous deployment and feature development.

### 🏗️ **Branch Hierarchy**

```
┌─────────────────────────────────────────────────────────────┐
│                         PRODUCTION                          │
│                      main (protected)                      │
│                    🚀 Live deployment                      │
│                   Auto-deploys to Render                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                        STAGING                             │
│                   staging (protected)                      │
│                  🧪 Pre-production testing                 │
│                 Integration & final QA                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                      DEVELOPMENT                           │
│                        dev (active)                        │
│                   🛠️ Feature integration                   │
│                   Continuous development                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
              ┌───────┴───────┐
              │               │
┌─────────────▼─┐   ┌─────────▼─────┐
│  feature/xxx  │   │  hotfix/xxx   │
│  🔧 New work  │   │  🚨 Critical  │
│               │   │     fixes     │
└───────────────┘   └───────────────┘
```

---

## 🎯 **Branch Purposes**

### 🚀 **`main` (Production)**
- **Purpose**: Live production code
- **Deploys**: Automatically to Render production
- **Protection**: Protected branch, PR required
- **Stability**: Must be always deployable
- **Testing**: Fully tested, QA approved

### 🧪 **`staging` (Pre-Production)** 
- **Purpose**: Final testing before production
- **Deploys**: Staging environment (if configured)
- **Protection**: Protected branch, PR required
- **Testing**: Integration testing, UAT, performance testing
- **Duration**: Features stay here 1-3 days for testing

### 🛠️ **`dev` (Development)**
- **Purpose**: Active development and feature integration
- **Deploys**: Development environment
- **Protection**: Semi-protected, direct commits allowed for maintainers
- **Testing**: Unit tests, basic integration tests
- **Activity**: Most active branch, daily commits

### 🔧 **Feature Branches**
- **Naming**: `feature/tier-sync`, `feature/ai-chatbot`, `feature/security-audit`
- **Purpose**: Individual feature development
- **Lifecycle**: Created from `dev`, merged back to `dev`
- **Testing**: Local testing, feature-specific tests

### 🚨 **Hotfix Branches**
- **Naming**: `hotfix/security-patch`, `hotfix/critical-bug`
- **Purpose**: Critical production fixes
- **Lifecycle**: Created from `main`, merged to both `main` and `dev`
- **Priority**: Immediate deployment, bypass normal flow

---

## 🔄 **Workflow Process**

### 🆕 **New Feature Development**
```bash
# 1. Start from dev
git checkout dev
git pull origin dev

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Develop and commit
git add .
git commit -m "feat: implement new feature"

# 4. Push and create PR to dev
git push -u origin feature/your-feature-name
# Create PR: feature/your-feature-name → dev

# 5. After approval, feature is merged to dev
# 6. Delete feature branch
git branch -d feature/your-feature-name
```

### 🧪 **Staging Release**
```bash
# 1. When dev is ready for testing
git checkout staging
git pull origin staging

# 2. Create PR: dev → staging
# 3. After merge, staging is tested
# 4. If issues found, fix in dev and repeat
```

### 🚀 **Production Release**
```bash
# 1. When staging is approved
git checkout main
git pull origin main

# 2. Create PR: staging → main
# 3. After merge, automatic deployment to production
# 4. Tag the release
git tag -a v1.2.0 -m "Release v1.2.0: Tier sync improvements"
git push origin v1.2.0
```

### 🚨 **Hotfix Process**
```bash
# 1. Critical issue in production
git checkout main
git pull origin main

# 2. Create hotfix branch
git checkout -b hotfix/critical-security-fix

# 3. Fix and test
git add .
git commit -m "hotfix: patch security vulnerability"

# 4. Create PR to main (immediate)
git push -u origin hotfix/critical-security-fix
# PR: hotfix/critical-security-fix → main

# 5. Also merge to dev to keep in sync
# PR: hotfix/critical-security-fix → dev
```

---

## 🛡️ **Branch Protection Rules**

### **`main` Branch Protection**
- ✅ Require pull request reviews (2 reviewers)
- ✅ Dismiss stale reviews when new commits are pushed
- ✅ Require status checks to pass
- ✅ Require branches to be up to date before merging
- ✅ Restrict pushes to specific people/teams
- ✅ Allow force pushes: **NO**
- ✅ Allow deletions: **NO**

### **`staging` Branch Protection**
- ✅ Require pull request reviews (1 reviewer)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date before merging
- ✅ Allow force pushes: **NO**

### **`dev` Branch Protection**
- ✅ Semi-protected (maintainers can push directly)
- ✅ Require status checks for PRs
- ✅ Allow force pushes: **LIMITED**

---

## 🏷️ **Semantic Versioning & Tagging**

### **Version Format**: `v{MAJOR}.{MINOR}.{PATCH}`

- **MAJOR**: Breaking changes, major features
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, security patches

### **Tag Examples**:
- `v1.0.0` - Initial production release
- `v1.1.0` - Tier sync feature release
- `v1.1.1` - Security patch
- `v2.0.0` - Major UI overhaul (breaking changes)

---

## 🚀 **Deployment Strategy**

### **Render Auto-Deployment**
```yaml
Environments:
  Production:  main branch    → budget-buddy-prod.onrender.com
  Staging:     staging branch → budget-buddy-staging.onrender.com  
  Development: dev branch     → budget-buddy-dev.onrender.com
```

### **Environment Variables**
- Each environment has its own `.env` configuration
- Database separation between environments
- API endpoints configured per environment

---

## 📝 **Commit Message Convention**

### **Format**: `type(scope): description`

### **Types**:
- `feat`: New feature
- `fix`: Bug fix  
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `chore`: Build process or auxiliary tool changes
- `security`: Security improvements
- `perf`: Performance improvements

### **Examples**:
```
feat(auth): implement tier synchronization
fix(ledger): resolve tier recognition issue  
docs(branching): add git workflow documentation
security(api): patch SQL injection vulnerability
chore(deps): update React Native to 0.75
```

---

## 🎯 **Current Status**

### **Branches Created**:
- ✅ `main` - Production ready with tier sync
- ✅ `staging` - Ready for pre-production testing  
- ✅ `dev` - Active development branch

### **Next Steps**:
1. Set up branch protection rules on GitHub
2. Configure Render deployments for each environment
3. Create first feature branch for new development
4. Set up automated testing pipeline

---

## 🛠️ **Quick Commands Reference**

```bash
# Switch to development
git checkout dev

# Create new feature
git checkout -b feature/your-feature-name

# Push feature for review
git push -u origin feature/your-feature-name

# Update dev branch
git checkout dev && git pull origin dev

# Release to staging
# (Create PR: dev → staging on GitHub)

# Deploy to production  
# (Create PR: staging → main on GitHub)

# Emergency hotfix
git checkout main && git checkout -b hotfix/urgent-fix
```

This branching strategy ensures **stable production**, **thorough testing**, and **smooth feature development**! 🚀