# Backend Deployment Guide

The DriveGuard AI backend requires a platform that supports both Node.js and Python. This guide covers multiple deployment options.

## 🎯 Recommended Platforms

### Option 1: Railway.app (Recommended) ⭐

**Best for**: Full-stack apps with Docker support, free tier available

#### Steps:

1. **Sign up**: Go to [railway.app](https://railway.app) and sign in with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `amanop29/DRIVEGUARD-AI`

3. **Configure Service**:
   - Railway will auto-detect the Dockerfile
   - Set environment variables:
     ```
     NODE_ENV=production
     PORT=3001
     FRONTEND_URL=https://amanop29.github.io/DRIVEGUARD-AI
     ```

4. **Deploy**:
   - Railway will build and deploy automatically
   - Get your deployment URL (e.g., `https://driveguard-ai-production.up.railway.app`)

5. **Enable CORS**: Backend is pre-configured to accept requests from your frontend

#### Cost: 
- Free tier: $5 credit/month
- Enough for development and light usage

---

### Option 2: Render.com

**Best for**: Easy deployment with free tier

#### Steps:

1. **Sign up**: Go to [render.com](https://render.com) and sign in with GitHub

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repo: `amanop29/DRIVEGUARD-AI`
   - Select "Docker" as environment

3. **Configure**:
   - **Name**: driveguard-ai-backend
   - **Region**: Choose closest to your users
   - **Branch**: main
   - **Root Directory**: backend
   - **Docker Command**: (auto-detected from Dockerfile)

4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3001
   FRONTEND_URL=https://amanop29.github.io/DRIVEGUARD-AI
   ```

5. **Deploy**: Click "Create Web Service"

6. **Get URL**: Copy your service URL (e.g., `https://driveguard-ai.onrender.com`)

#### Cost:
- Free tier: Limited resources, spins down after inactivity
- Paid tier: $7/month for always-on service

---

### Option 3: Heroku

**Best for**: Traditional PaaS with good documentation

#### Steps:

1. **Install Heroku CLI**:
   ```bash
   brew install heroku/brew/heroku
   ```

2. **Login**:
   ```bash
   heroku login
   ```

3. **Create App**:
   ```bash
   heroku create driveguard-ai-backend
   ```

4. **Add Buildpacks**:
   ```bash
   heroku buildpacks:add --index 1 heroku/python
   heroku buildpacks:add --index 2 heroku/nodejs
   ```

5. **Set Environment Variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set FRONTEND_URL=https://amanop29.github.io/DRIVEGUARD-AI
   ```

6. **Deploy**:
   ```bash
   git push heroku main
   ```

7. **Scale**:
   ```bash
   heroku ps:scale web=1
   ```

#### Cost:
- Eco plan: $5/month per dyno
- Basic plan: $7/month per dyno

---

### Option 4: DigitalOcean App Platform

**Best for**: Scalable production deployments

#### Steps:

1. **Create Account**: [DigitalOcean](https://www.digitalocean.com)

2. **Create App**:
   - Go to App Platform
   - Click "Create App"
   - Select GitHub and choose your repo

3. **Configure**:
   - Detect Dockerfile automatically
   - Set environment variables
   - Choose plan (starts at $5/month)

4. **Deploy**: DigitalOcean handles the rest

---

## 🔧 Local Development

### Prerequisites:
```bash
# Node.js 20+
node --version

# Python 3.10+
python3 --version

# Install dependencies
cd backend
npm install
pip install -r config/requirements.txt
```

### Run Locally:
```bash
cd backend
npm start
```

Backend will run at: `http://localhost:3001`

---

## 🐳 Docker Deployment

### Build Image:
```bash
cd backend
docker build -t driveguard-ai-backend .
```

### Run Container:
```bash
docker run -p 3001:3001 \
  -e NODE_ENV=production \
  -e FRONTEND_URL=https://amanop29.github.io/DRIVEGUARD-AI \
  driveguard-ai-backend
```

### Docker Compose:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - FRONTEND_URL=https://amanop29.github.io/DRIVEGUARD-AI
    volumes:
      - ./backend/videos:/app/backend/videos
      - ./backend/outputs:/app/backend/outputs
      - ./backend/data:/app/backend/data
```

---

## 📱 Connect Frontend to Backend

After deploying the backend, update your frontend to use the backend URL:

1. Open `frontend/src/App.tsx` or your API configuration file

2. Update the API base URL:
   ```typescript
   const API_BASE_URL = 'https://your-backend-url.railway.app';
   // or
   const API_BASE_URL = 'https://driveguard-ai.onrender.com';
   ```

3. Commit and push changes:
   ```bash
   git add .
   git commit -m "Update API endpoint"
   git push origin main
   ```

Frontend will automatically redeploy via GitHub Actions.

---

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **CORS**: Backend is configured to accept your frontend domain
3. **File Upload**: 500MB limit configured for video uploads
4. **Authentication**: Consider adding JWT tokens for production
5. **Rate Limiting**: Add rate limiting for API endpoints

---

## 📊 Monitoring

### Health Check Endpoint:
```bash
curl https://your-backend-url/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "DriveGuard AI Backend is running"
}
```

### Test Upload:
```bash
curl -X POST https://your-backend-url/api/upload-video \
  -F "video=@test.mp4"
```

---

## 🐛 Troubleshooting

### Issue: Build fails on Railway/Render

**Solution**: Check that:
- Dockerfile is in the `backend/` directory
- All dependencies are in `package.json` and `requirements.txt`
- YOLO models are excluded (they're downloaded on first run)

### Issue: Python script not found

**Solution**: Ensure the Docker image includes the `analysis/` directory

### Issue: Out of memory

**Solution**: 
- Upgrade to a paid tier with more RAM
- Optimize video processing to use smaller models
- Process videos in chunks

### Issue: Slow video processing

**Solution**:
- Use GPU-enabled instances (Railway Pro, Render Standard)
- Reduce video resolution before processing
- Use YOLOv8n (nano) model instead of YOLOv8s

---

## 📈 Scaling Tips

1. **Use CDN**: Serve processed videos from CDN (Cloudflare, AWS CloudFront)
2. **Queue System**: Implement job queue (Bull, Redis) for video processing
3. **Database**: Move from JSON to PostgreSQL/MongoDB
4. **Caching**: Add Redis for API response caching
5. **Load Balancing**: Use platform's auto-scaling features

---

## 💰 Cost Comparison

| Platform | Free Tier | Paid Tier | Best For |
|----------|-----------|-----------|----------|
| Railway | $5 credit/month | $5/month | Development |
| Render | 750 hours/month | $7/month | Small projects |
| Heroku | None | $5-7/month | Established apps |
| DigitalOcean | None | $5+/month | Production |

---

## ✅ Deployment Checklist

- [ ] Backend deployed on Railway/Render
- [ ] Environment variables configured
- [ ] Health check endpoint responding
- [ ] CORS configured for frontend domain
- [ ] Frontend updated with backend URL
- [ ] Test video upload working
- [ ] Test analysis processing working
- [ ] User registration/login working
- [ ] Monitor logs for errors

---

## 🆘 Support

- **GitHub Issues**: [Create issue](https://github.com/amanop29/DRIVEGUARD-AI/issues)
- **Documentation**: Check `docs/` folder
- **Railway Docs**: [railway.app/docs](https://docs.railway.app)
- **Render Docs**: [render.com/docs](https://render.com/docs)

---

**Next Steps**: 
1. Deploy backend using one of the options above
2. Get your backend URL
3. Update frontend API configuration
4. Test the full application flow
