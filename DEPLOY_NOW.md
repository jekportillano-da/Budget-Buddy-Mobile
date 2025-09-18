"""
🚀 INSTANT RAILWAY DEPLOYMENT GUIDE
Deploy Budget Buddy Backend in 5 minutes
"""

# =============================================================================
# OPTION 1: GITHUB DEPLOYMENT (Recommended - Easiest)
# =============================================================================

# Step 1: Commit and push all changes
git add .
git commit -m "Complete Step 7: Production deployment setup for Railway"
git push origin main

# Step 2: Deploy via Railway Dashboard
1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose "Budget-Buddy-Mobile" repository
6. Railway auto-detects FastAPI backend

# Step 3: Add PostgreSQL database
1. In Railway project → "Add Service" → "PostgreSQL"
2. Database URL automatically provided

# Step 4: Set environment variables
1. Railway Dashboard → Variables → Add:
   SECRET_KEY = [generate with: python -c "import secrets; print(secrets.token_hex(32))"]
   COHERE_API_KEY = [your Cohere API key]
   ENVIRONMENT = production

# Step 5: Deploy automatically happens!
✅ Railway builds and deploys automatically
✅ Provides HTTPS domain: your-app-name.railway.app
✅ SSL certificate included

# =============================================================================
# OPTION 2: MANUAL RAILWAY CLI DEPLOYMENT
# =============================================================================

# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway add --database postgresql
railway deploy

# =============================================================================
# STEP 6: UPDATE FRONTEND
# =============================================================================

# Update .env.local with your Railway domain:
EXPO_PUBLIC_BACKEND_URL=https://your-app-name.railway.app
EXPO_PUBLIC_API_MODE=backend
EXPO_PUBLIC_ENABLE_HYBRID_AI=true

# =============================================================================
# STEP 7: TEST DEPLOYMENT
# =============================================================================

# Test your deployed backend:
curl https://your-app-name.railway.app/health
# Visit API docs: https://your-app-name.railway.app/docs

# =============================================================================
# ENVIRONMENT VARIABLES NEEDED IN RAILWAY
# =============================================================================

SECRET_KEY=your_32_character_secret_key
COHERE_API_KEY=your_cohere_api_key
ENVIRONMENT=production
DATABASE_URL=automatically_provided_by_railway

# =============================================================================
# COST: FREE TIER AVAILABLE
# =============================================================================

Railway Free Tier:
- 500 execution hours/month
- Perfect for development/testing
- Upgrade to Pro ($20/month) for production

# =============================================================================
# EXPECTED DEPLOYMENT TIME: 3-5 MINUTES
# =============================================================================

✅ Railway deployment typically takes 2-3 minutes
✅ Database initialization: ~1 minute  
✅ SSL certificate: Automatic
✅ Custom domain: Available on Pro plan

Your Budget Buddy backend will be live at:
https://your-app-name.railway.app

Ready to deploy! 🚀