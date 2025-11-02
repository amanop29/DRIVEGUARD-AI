# DriveGuard AI Deployment Guide

This guide covers deploying DriveGuard AI to various hosting platforms.

## 🌐 Deployment Architecture

DriveGuard AI consists of two main components:
1. **Frontend (React + TypeScript)** - Static web application
2. **Backend (Node.js + Python)** - API server and AI processing

## 📦 Deployment Options

### Option 1: GitHub Pages (Frontend Only) - FREE ⭐ RECOMMENDED

Perfect for showcasing the UI and documentation.

#### What Gets Deployed
- ✅ Frontend React application
- ✅ Interactive UI components
- ✅ Demo mode with sample data
- ❌ Backend API (requires separate hosting)
- ❌ Video upload/analysis (needs backend)

#### Automatic Deployment

The project is configured for **automatic deployment** to GitHub Pages:

1. **Push to main branch** - automatically triggers deployment
2. **GitHub Actions** builds and deploys the frontend
3. **Live in ~2-3 minutes** at: `https://amanop29.github.io/DRIVEGUARD-AI/`

#### Manual Setup (One-Time)

1. **Enable GitHub Pages**:
   - Go to: https://github.com/amanop29/DRIVEGUARD-AI/settings/pages
   - Source: `GitHub Actions`
   - Save

2. **Verify Workflow**:
   - Push any changes to `main` branch
   - Check: https://github.com/amanop29/DRIVEGUARD-AI/actions
   - Wait for green checkmark ✅

3. **Access Your Site**:
   - Visit: https://amanop29.github.io/DRIVEGUARD-AI/

#### Environment Configuration

The frontend automatically adapts:
- **Development**: API calls to `http://localhost:3001`
- **Production (GitHub Pages)**: Demo mode with sample data

### Option 2: Full Stack Deployment (Frontend + Backend)

For complete functionality including video upload and analysis.

#### 2.1. Render.com (Recommended for Backend) - FREE TIER

**Backend Deployment:**

1. **Create Account**: https://render.com

2. **Create Web Service**:
   - Connect your GitHub repository
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`

3. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   ```

4. **Add Python Environment**:
   - Go to Shell tab
   - Run: `pip install -r config/requirements.txt`

5. **Note Your URL**: `https://your-service.onrender.com`

**Frontend Configuration:**

Update API endpoint in frontend for production:
```typescript
// src/config/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-service.onrender.com/api'
  : 'http://localhost:3001/api';
```

#### 2.2. Railway.app - EASY DEPLOYMENT

1. **Create Account**: https://railway.app
2. **New Project** → **Deploy from GitHub**
3. **Select Repository**: amanop29/DRIVEGUARD-AI
4. **Configure Services**:

   **Backend Service**:
   - Root Directory: `/backend`
   - Build Command: `npm install && pip install -r config/requirements.txt`
   - Start Command: `node server.js`
   - Add Port: 3001

   **Frontend Service**:
   - Root Directory: `/frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview`
   - Add Port: 5173

5. **Environment Variables**:
   ```
   # Backend
   NODE_ENV=production
   PORT=3001
   
   # Frontend
   VITE_API_URL=https://your-backend.railway.app
   ```

#### 2.3. Vercel (Frontend) + Render (Backend)

**Frontend (Vercel)**:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

**Backend (Render)**: Follow steps from 2.1

#### 2.4. AWS (Production Grade)

**Frontend**: S3 + CloudFront
**Backend**: EC2 or ECS
**Storage**: S3 for videos
**Database**: RDS (if needed)

See AWS documentation for detailed setup.

#### 2.5. Heroku

**Note**: Heroku no longer offers free tier.

1. **Create Account**: https://heroku.com
2. **Install Heroku CLI**
3. **Deploy**:
   ```bash
   heroku create driveguard-ai-backend
   git subtree push --prefix backend heroku main
   ```

## 🔧 Pre-Deployment Checklist

### Frontend
- [ ] Update API endpoints for production
- [ ] Build and test locally: `npm run build`
- [ ] Check bundle size
- [ ] Configure CORS for backend URL
- [ ] Add production environment variables

### Backend
- [ ] Install all dependencies
- [ ] Test Python scripts
- [ ] Configure file upload limits
- [ ] Set up storage (S3 for production)
- [ ] Configure CORS for frontend URL
- [ ] Add error logging (Sentry, etc.)
- [ ] Set up monitoring

### Security
- [ ] Add authentication (JWT)
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Add input validation
- [ ] Sanitize file uploads
- [ ] Add virus scanning for videos

## 📋 Environment Variables

### Backend (.env)
```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://amanop29.github.io/DRIVEGUARD-AI
UPLOAD_DIR=/tmp/uploads
MAX_FILE_SIZE=500000000
PYTHON_PATH=/usr/bin/python3
```

### Frontend (.env.production)
```bash
VITE_API_URL=https://your-backend.onrender.com
VITE_APP_ENV=production
```

## 🚀 Deployment Commands

### Build Frontend Locally
```bash
cd frontend
npm install
npm run build
# Output in frontend/dist/
```

### Test Backend Locally
```bash
cd backend
npm install
pip3 install -r config/requirements.txt
node server.js
```

### Deploy to GitHub Pages (Manual)
```bash
cd frontend
npm run build
# Push to main branch - auto-deploys via GitHub Actions
```

## 🔍 Monitoring & Maintenance

### Check Deployment Status
- **GitHub Pages**: https://github.com/amanop29/DRIVEGUARD-AI/deployments
- **GitHub Actions**: https://github.com/amanop29/DRIVEGUARD-AI/actions

### Logs
```bash
# GitHub Actions logs
# Available in Actions tab after each deployment

# Backend logs (Render)
# Available in Render dashboard

# Frontend errors
# Check browser console
```

### Health Checks
```bash
# Backend health
curl https://your-backend.onrender.com/api/health

# Frontend health
curl https://amanop29.github.io/DRIVEGUARD-AI/
```

## 🛠️ Troubleshooting

### GitHub Pages 404 Error
- Check that `base` in `vite.config.ts` matches repository name
- Verify GitHub Pages is enabled in repository settings
- Check Actions tab for deployment errors

### Build Failures
- Check Node.js version (requires 16+)
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run build`

### Backend Not Connecting
- Verify backend URL in frontend config
- Check CORS configuration in backend
- Ensure backend is running: `curl <backend-url>/api/health`

### Video Upload Fails
- Check file size limits
- Verify storage configuration
- Check backend logs for errors
- Ensure Python dependencies are installed

## 📚 Additional Resources

### Documentation
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)

### Support
- GitHub Issues: https://github.com/amanop29/DRIVEGUARD-AI/issues
- Repository: https://github.com/amanop29/DRIVEGUARD-AI

## 🎯 Recommended Setup for Different Use Cases

### 1. Portfolio/Demo (No Backend Needed)
- **Frontend**: GitHub Pages ✅ FREE
- **Features**: UI showcase, sample data
- **Setup Time**: 5 minutes
- **Cost**: $0/month

### 2. Small Team/Testing (Backend Needed)
- **Frontend**: GitHub Pages ✅ FREE
- **Backend**: Render.com ✅ FREE TIER
- **Features**: Full functionality with limitations
- **Setup Time**: 30 minutes
- **Cost**: $0/month (with limits)

### 3. Production/Business (Full Scale)
- **Frontend**: Vercel or CloudFront
- **Backend**: AWS EC2/ECS or Railway
- **Storage**: AWS S3
- **Database**: PostgreSQL (if needed)
- **Setup Time**: 2-4 hours
- **Cost**: ~$20-100/month

## 🔒 Security Considerations

For production deployment, implement:

1. **Authentication**: JWT tokens for user sessions
2. **Rate Limiting**: Prevent API abuse
3. **Input Validation**: Sanitize all user inputs
4. **File Scanning**: Virus checking for uploads
5. **HTTPS**: SSL certificates (Let's Encrypt)
6. **Environment Variables**: Never commit secrets
7. **Logging**: Track all operations
8. **Monitoring**: Uptime and error tracking

## 📊 Performance Optimization

### Frontend
- Enable Vite build optimizations
- Use code splitting
- Compress images
- Enable CDN caching

### Backend
- Use Redis for caching
- Queue video processing jobs
- Optimize YOLO model size
- Scale horizontally with multiple instances

## ✅ Post-Deployment

After successful deployment:

1. **Test All Features**:
   - Frontend loads correctly
   - Backend API responds
   - Video upload works
   - Analysis generates results

2. **Monitor Performance**:
   - Check response times
   - Monitor error rates
   - Track resource usage

3. **Update Documentation**:
   - Add live URLs to README
   - Document any issues
   - Update deployment guide

4. **Share**:
   - Add live demo to portfolio
   - Share on social media
   - Add to GitHub profile

---

## 🎉 Current Deployment Status

- **Frontend (GitHub Pages)**: https://amanop29.github.io/DRIVEGUARD-AI/
- **Backend**: Not yet deployed (requires setup above)
- **Repository**: https://github.com/amanop29/DRIVEGUARD-AI

**Last Updated**: November 2025
