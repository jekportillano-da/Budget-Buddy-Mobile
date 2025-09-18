# 🚀 Railway Deployment Guide for Budget Buddy Backend

## Quick Railway Deployment

### Step 1: Railway Account Setup
1. Go to [Railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Connect your GitHub repository

### Step 2: Create New Project
```bash
# Option A: Deploy from GitHub (Recommended)
1. Click "New Project"
2. Select "Deploy from GitHub repo" 
3. Choose your "Budget-Buddy-Mobile" repository
4. Railway will auto-detect the FastAPI backend

# Option B: Railway CLI (Advanced)
npm install -g @railway/cli
railway login
railway init
railway deploy
```

### Step 3: Configure Environment Variables
In Railway Dashboard → Your Project → Variables, add:

```env
# Required Variables
SECRET_KEY=your-super-secret-jwt-key-here
COHERE_API_KEY=your-cohere-api-key-here
DATABASE_URL=automatically-provided-by-railway

# Optional Variables
OPENAI_API_KEY=your-openai-key-if-needed
ENVIRONMENT=production
```

### Step 4: Add PostgreSQL Database
1. In Railway Dashboard → Add Service → PostgreSQL
2. DATABASE_URL will be automatically provided
3. No additional configuration needed

### Step 5: Deploy Settings
Railway will automatically:
- Detect `requirements.txt` and install dependencies
- Use `Dockerfile` for containerization
- Set PORT environment variable
- Provide HTTPS SSL certificate
- Generate domain: `your-app-name.railway.app`

## Frontend Configuration

### Update React Native App
Add to your `.env.local`:
```env
# Production Backend URL (replace with your Railway domain)
EXPO_PUBLIC_BACKEND_URL=https://your-app-name.railway.app
EXPO_PUBLIC_API_MODE=backend
EXPO_PUBLIC_ENABLE_HYBRID_AI=true
```

### Test Production Backend
```bash
# Test health endpoint
curl https://your-app-name.railway.app/health

# Test API documentation
https://your-app-name.railway.app/docs
```

## Railway Configuration Files

### 1. Dockerfile (✅ Already created)
- Multi-stage build for production
- Non-root user for security
- Health checks included

### 2. requirements.txt (✅ Updated)
- Production dependencies
- PostgreSQL support
- Optimized for Railway

### 3. railway.json (✅ Created)
- Railway-specific configuration
- Auto-restart policies
- Resource allocation

## Environment Variables Guide

### Required for Production:
```env
SECRET_KEY=generate-with-openssl-rand-hex-32
COHERE_API_KEY=your-cohere-api-key
DATABASE_URL=postgresql://user:pass@host:port/db
PORT=8000
```

### Optional:
```env
OPENAI_API_KEY=your-openai-key
RAILWAY_ENVIRONMENT=production
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

## Domain & SSL

Railway automatically provides:
- ✅ Free HTTPS SSL certificate
- ✅ Auto-generated domain: `appname.railway.app`
- ✅ Custom domain support (upgrade to Pro)

## Monitoring & Logs

Access in Railway Dashboard:
- **Deployments**: View build logs and status
- **Metrics**: CPU, memory, request metrics
- **Logs**: Real-time application logs
- **Variables**: Environment variable management

## Cost Estimate

Railway Pricing:
- **Starter Plan**: $0/month (500 hours execution time)
- **Pro Plan**: $20/month (unlimited + custom domains)
- **Database**: $5/month for PostgreSQL

## Post-Deployment Checklist

### ✅ Backend Verification
- [ ] Health endpoint returns 200: `/health`
- [ ] API docs accessible: `/docs`
- [ ] Authentication endpoints work: `/auth/register`
- [ ] AI endpoints functional: `/ai/chat`
- [ ] Database migrations successful

### ✅ Frontend Integration
- [ ] Update EXPO_PUBLIC_BACKEND_URL to Railway domain
- [ ] Test hybrid API switching (backend → direct fallback)
- [ ] Verify authentication flow works
- [ ] Test AI services through backend
- [ ] Confirm offline fallback still works

### ✅ Security
- [ ] SECRET_KEY is secure random string
- [ ] API keys are properly set
- [ ] CORS origins are configured correctly
- [ ] Database uses SSL (Railway default)

## Troubleshooting

### Build Failures
```bash
# Check Railway build logs
# Common issues:
1. Missing dependencies in requirements.txt
2. Python version compatibility
3. Environment variables not set
```

### Runtime Errors
```bash
# Check Railway logs for:
1. Database connection errors
2. Missing API keys
3. CORS configuration issues
4. Port binding problems
```

### Database Issues
```bash
# Railway PostgreSQL troubleshooting:
1. Check DATABASE_URL format
2. Verify migrations ran successfully
3. Check connection limits
```

## Scaling & Performance

Railway automatically handles:
- ✅ Auto-scaling based on traffic
- ✅ Load balancing across regions
- ✅ CDN for static assets
- ✅ Health checks and auto-restart

## Custom Domain Setup (Pro Plan)

1. Add custom domain in Railway Dashboard
2. Update DNS records as instructed
3. SSL certificate auto-generated
4. Update frontend EXPO_PUBLIC_BACKEND_URL

---

## 🎯 Quick Start Commands

```bash
# 1. Push backend changes to GitHub
git add backend/
git commit -m "Railway production deployment setup"
git push origin main

# 2. Deploy to Railway (auto-triggered by push)
# Railway will build and deploy automatically

# 3. Set environment variables in Railway Dashboard
# Add SECRET_KEY, COHERE_API_KEY, etc.

# 4. Test deployment
curl https://your-app-name.railway.app/health
```

Your Budget Buddy backend will be live in minutes! 🚀