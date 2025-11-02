# DRIVEGUARD AI 🚗💨

[![Status](https://img.shields.io/badge/status-deployed-success)](https://amanop29.github.io/DRIVEGUARD-AI/)
[![Version](https://img.shields.io/badge/version-2.0.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-purple)]()
[![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20TypeScript-61DAFB)]()
[![Backend](https://img.shields.io/badge/backend-Node.js%20%2B%20Python-339933)]()

**AI-Powered Dashcam Video Analysis with Real-Time Processing & Fleet Management**

DriveGuard AI analyzes dashcam footage to provide comprehensive driving safety scores, behavior insights, and actionable recommendations. Features **real-time video processing**, **YOLOv8 object detection**, and **multi-account fleet management**.

> **🎉 Latest Update:** Fully deployed with optimized Docker containers & production-ready infrastructure (November 2025)

## 🌐 Live Application

### 🎯 Production Deployments

| Component | Status | URL | Platform |
|-----------|--------|-----|----------|
| **Frontend** | ✅ Live | [amanop29.github.io/DRIVEGUARD-AI](https://amanop29.github.io/DRIVEGUARD-AI/) | GitHub Pages |
| **Backend API** | 🚀 Ready | Deploy with Railway/Render | Docker Container |
| **Repository** | 📦 Public | [github.com/amanop29/DRIVEGUARD-AI](https://github.com/amanop29/DRIVEGUARD-AI) | GitHub |

> **Note**: Frontend is live with sample data. Deploy the backend for full video upload and analysis functionality. See [Quick Deploy](#-quick-deploy) below.

## ✨ Key Features

### 🎥 Real-Time Video Processing
- **Upload ANY video** through web interface
- **Live progress tracking** (0-100%)
- **Instant results** with driving scores
- **Automatic analysis** of safety metrics

### 📊 Comprehensive Analysis
- **Speed Calculation** - Average speed with calibration
- **Traffic Signal Detection** - Red light violations
- **Close Encounter Analysis** - Vehicle proximity using YOLO
- **Lane Change Detection** - Optical flow tracking
- **Turn Analysis** - ORB feature detection
- **Bus Lane Violations** - HSV color detection

### 🏆 Smart Scoring System
- **Safety Score** (50% weight) - Based on close encounters
- **Compliance Score** (30% weight) - Traffic and bus lane violations
- **Efficiency Score** (20% weight) - Lane change behavior
- **Overall Grade** - Excellent / Good / Average / Needs Improvement / Poor

### 📈 Interactive Visualizations
- **Speed Timeline Chart** - Real-time speed with event markers
- **Safety Violations Breakdown** - PieChart with statistics
- **Close Encounter Severity** - BarChart by distance

### 👥 Multi-Account Support
- **Individual Accounts** - Personal driving analysis
- **Enterprise Accounts** - Fleet management with driver/vehicle tracking

## 🚀 Quick Deploy

### Option 1: Deploy Backend to Railway (Recommended - 10 minutes)

```bash
# Run the interactive deployment script
./deploy-backend.sh
```

Or manually:
1. Visit [railway.app](https://railway.app) and sign in with GitHub
2. Create New Project → Deploy from GitHub repo
3. Select `amanop29/DRIVEGUARD-AI`
4. Railway auto-detects the Dockerfile
5. Set environment variables: `NODE_ENV=production`, `PORT=3001`
6. Deploy! Get your backend URL

**Cost**: $5 free credit/month (enough for development/testing)

### Option 2: Local Development

**Install Dependencies:**
```bash
# Backend
cd backend
npm install
pip3 install -r config/requirements.minimal.txt

# Frontend
cd ../frontend
npm install
```

**Start Services:**
```bash
# Terminal 1 - Backend (API + Python Analysis)
cd backend
npm start
# Running on http://localhost:3001

# Terminal 2 - Frontend (React UI)
cd frontend
npm run dev
# Running on http://localhost:5173
```

Then open **http://localhost:5173** in your browser!

### Option 3: Docker (Production-like Environment)

```bash
# Build and run with Docker
cd backend
docker build -t driveguard-backend .
docker run -p 3001:3001 driveguard-backend
```

## 📋 Prerequisites

### For Deployment (Recommended Path)
- **GitHub Account** (for Railway/Render deployment)
- **Web Browser** (to access the dashboard)
- That's it! Railway/Render handles everything else

### For Local Development
- **Node.js** v16+ ([Download](https://nodejs.org/))
- **Python** 3.8+ ([Download](https://www.python.org/))
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

### System Requirements (Local Development)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space (5GB with minimal dependencies)
- **OS**: macOS, Linux, Windows (WSL2 recommended for Windows)
- **GPU**: Optional (for faster YOLO processing, speeds up analysis 3-5x)

## 📦 Installation

### 1. Install Dependencies

#### Frontend Packages
```bash
cd frontend
npm install
```

This installs:
- React 18.3.1 + TypeScript
- Vite 6.3.5
- Radix UI components
- Recharts (visualization)
- Tailwind CSS

#### Backend Packages
```bash
cd backend
npm install
```

This installs:
- Express + Multer + CORS (Node.js API)

#### Python Packages
```bash
cd backend
pip3 install -r config/requirements.txt
```

This installs:
- opencv-python
- numpy
- ultralytics (YOLO)
- matplotlib
- torch (PyTorch with MPS for Apple Silicon)

### 2. Verify Setup
```bash
# Check Node.js version
node --version  # Should be v16+

# Check Python version
python3 --version  # Should be 3.8+

# Test backend health
curl http://localhost:3001/api/health
```

## 🎯 Usage Guide

### Upload & Analyze Video

1. **Navigate to Upload Page**
   - Click "Upload Video" in dashboard

2. **Select Video**
   - Drag & drop OR click to browse
   - Supported: MP4, AVI, MOV
   - Max size: 500MB

3. **Add Metadata** (Optional)
   - Enter car number
   - Select driver (Enterprise)
   - Select vehicle (Enterprise)

4. **Upload & Track**
   - Click "Upload and Analyze"
   - Watch progress bar (real-time updates!)
   - Processing stages:
     - 10%: Analysis started
     - 30%: Speed calculation
     - 50%: Traffic signals
     - 70%: Close encounters
     - 90%: Driving scores
     - 100%: Complete!

5. **View Results**
   - Automatic redirect to dashboard
   - Interactive charts
   - Detailed metrics
   - Driving score with category

### View Existing Analyses

- Dashboard shows all processed videos
- Click on any video to see details
- Compare multiple videos
- Export reports (coming soon)

## 📁 Project Structure (Reorganized)

```
DRIVEGUARD AI/
│
├── backend/                      # Backend (Python AI + Node.js API)
│   ├── analysis/                # Core AI modules
│   │   ├── main_v2.py          # Main orchestrator
│   │   ├── enhanced_speed_detection.py
│   │   ├── enhanced_proximity_detection.py
│   │   ├── enhanced_traffic_detection.py
│   │   └── driving_score_calculator.py
│   ├── utils/                   # Utilities
│   ├── models/                  # YOLO models
│   ├── config/                  # Configuration
│   ├── data/                    # User data
│   ├── videos/                  # Input videos
│   ├── outputs/                 # Analysis results
│   └── server.js               # Node.js API
│
├── frontend/                    # Frontend (React + TypeScript)
│   ├── src/                    # React source
│   │   ├── components/         # UI components
│   │   ├── styles/            # Styling
│   │   └── types/             # TypeScript types
│   ├── public/                # Static assets
│   └── package.json           # Dependencies
│
├── docs/                        # Documentation
│   ├── README.md              # Docs index
│   ├── COMPLETE_SYSTEM_WORKFLOW.md
│   ├── BACKEND_DOCUMENTATION.md
│   ├── FRONTEND_DOCUMENTATION.md
│   └── guides/
│
├── README.md                    # This file
├── NEW_PROJECT_STRUCTURE.md     # Detailed structure
└── start.sh                    # Quick start script
```

**See [NEW_PROJECT_STRUCTURE.md](./NEW_PROJECT_STRUCTURE.md) for complete details.**

## 🏗️ System Architecture

```
┌─────────────────┐
│   Frontend      │  React + TypeScript + Vite
│ (Port 5173)     │  Location: /frontend/
│                 │  - Upload interface
└────────┬────────┘  - Progress tracking
         │           - Results display
         ↓
┌─────────────────┐
│  Backend API    │  Node.js + Express
│ (Port 3001)     │  Location: /backend/server.js
│                 │  - File upload (Multer)
└────────┬────────┘  - Job management
         │           - Status tracking
         ↓
┌─────────────────┐
│ Python Analysis │  OpenCV + YOLO + PyTorch
│                 │  Location: /backend/analysis/
│                 │  - Video processing
└─────────────────┘  - Score calculation
```


## 🔧 Configuration

### Video Calibration

Different videos may need different calibration. Edit `/AD Aman/video_calibrations.json`:

```json
{
  "YourVideo.mp4": {
    "pixels_per_meter": 25.0,
    "reference_distance_pixels": 150,
    "reference_distance_meters": 6.0
  }
}
```

### Upload Limits

Edit `server.js` to change max file size:

```javascript
limits: { 
  fileSize: 500 * 1024 * 1024  // 500MB
}
```

### Score Weights

Edit `/AD Aman/driving_score_calculator.py`:

```python
overall_score = (
    safety_score * 0.5 +      # Safety weight
    compliance_score * 0.3 +   # Compliance weight
    efficiency_score * 0.2     # Efficiency weight
)
```

## 📡 API Reference

### POST `/api/upload-video`
Upload and analyze a video file.

**Request:**
- `video`: Video file (multipart/form-data)
- `carNumber`: (optional) Vehicle plate
- `driverId`: (optional) Driver ID
- `vehicleId`: (optional) Vehicle ID

**Response:**
```json
{
  "jobId": "uuid-string",
  "message": "Video uploaded successfully"
}
```

### GET `/api/status/:jobId`
Check processing status.

**Response:**
```json
{
  "status": "processing|completed|failed",
  "progress": 75,
  "message": "Analyzing close encounters..."
}
```

### GET `/api/results/:filename`
Get analysis results for specific video.

### GET `/api/merged-analysis`
Get all video analyses.

### GET `/api/health`
Server health check.

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port is in use
lsof -i :3001

# Kill process and restart
kill -9 <PID>
node server.js
```

### Upload Fails
- Verify backend is running: `curl http://localhost:3001/api/health`
- Check video format (mp4/avi/mov)
- Ensure file size < 500MB
- Check browser console for errors

### Processing Stuck
- Verify YOLO model: `/AD Aman/yolov8n.pt`
- Check available RAM (need 4GB+ free)
- Try shorter/lower resolution video
- Check Python script output

### No Results
- Verify JSON files exist in `/AD Aman/`
- Check browser console for fetch errors
- Clear browser cache (Cmd+Shift+R)

## 📊 Performance

### Processing Times (Approximate)
| Duration | Resolution | Time     |
|----------|------------|----------|
| 1 min    | 720p       | ~2 min   |
| 1 min    | 1080p      | ~4 min   |
| 1 min    | 4K         | ~10 min  |
| 3 min    | 720p       | ~6 min   |

*Times vary based on system specifications*

## 🔒 Security Notes

⚠️ **Current setup is for development only**

For production deployment, add:
- Authentication (JWT)
- Rate limiting
- Input validation
- HTTPS communication
- Cloud storage (AWS S3)
- Virus scanning
- Proper logging
- Monitoring

## 📚 Documentation

### **Comprehensive Documentation Available**

All documentation is in the `/docs/` folder. Start here:

#### **📖 [docs/README.md](./docs/README.md) - Documentation Index**
Complete navigation guide to all documentation.

#### **🎯 For Presentations & Overview:**
- **[COMPLETE_SYSTEM_WORKFLOW.md](./docs/COMPLETE_SYSTEM_WORKFLOW.md)** - Complete system explained
  - Architecture, workflow, metrics, scoring
  - Perfect for presentations and understanding

#### **👨‍💻 For Development:**
- **[BACKEND_DOCUMENTATION.md](./docs/BACKEND_DOCUMENTATION.md)** - Backend & Python scripts
  - All Python AI modules explained
  - Node.js API documentation
  - Algorithms and configuration

- **[FRONTEND_DOCUMENTATION.md](./docs/FRONTEND_DOCUMENTATION.md)** - Frontend & React
  - All React components explained
  - UI/UX implementation
  - State management and routing

#### **📁 Project Structure:**
- **[NEW_PROJECT_STRUCTURE.md](./NEW_PROJECT_STRUCTURE.md)** - Reorganized structure
  - Complete directory layout
  - What changed and why
  - How to navigate the codebase

#### **🎓 Guides:**
- **[HOW_VIDEO_UPLOAD_WORKS.md](./docs/guides/HOW_VIDEO_UPLOAD_WORKS.md)** - Upload process
- **[PERFORMANCE_IMPROVEMENTS.md](./docs/guides/PERFORMANCE_IMPROVEMENTS.md)** - Optimizations

### **Quick Reference**

| Need to... | Read |
|------------|------|
| Understand the system | COMPLETE_SYSTEM_WORKFLOW.md |
| Work on Python code | BACKEND_DOCUMENTATION.md |
| Work on React UI | FRONTEND_DOCUMENTATION.md |
| Find files | NEW_PROJECT_STRUCTURE.md |
| Present to stakeholders | docs/README.md → Presentation guide |

## 🎨 Design

FIGMA: https://driveguard.figma.site

## 🚦 Current Status

✅ **Fully Operational**
- Real-time video processing: **Working**
- Backend API: **Running**
- Frontend interface: **Active**
- Score calculation: **Accurate**
- Interactive charts: **Functional**
- Multi-account support: **Enabled**

## 🔮 Future Enhancements

- [ ] WebSocket for real-time updates (no polling)
- [ ] GPU acceleration for YOLO
- [ ] Job queue for concurrent uploads
- [ ] Email notifications
- [ ] Cloud storage integration
- [ ] Mobile app
- [ ] Batch upload
- [ ] PDF report generation
- [ ] Advanced analytics

## 📦 Production Deployment

### Frontend Deployment (GitHub Pages) ✅ LIVE

The frontend is **already deployed** and live:

- **URL**: https://amanop29.github.io/DRIVEGUARD-AI/
- **Auto-Deploy**: Every push to `main` branch automatically rebuilds and deploys
- **Build Time**: 2-3 minutes via GitHub Actions
- **Status**: Check [Actions tab](https://github.com/amanop29/DRIVEGUARD-AI/actions)

### Backend Deployment 🚀 Deploy in 10 Minutes

The backend requires Docker-capable hosting. Choose one:

#### Option 1: Railway.app (⭐ Recommended)

**Why Railway?**
- ✅ $5 free credit/month (enough for testing)
- ✅ Auto-detects Dockerfile
- ✅ Easy environment variables
- ✅ Always-on (no cold starts)
- ✅ Built-in SSL certificates

**Deploy Steps:**
```bash
# Interactive script
./deploy-backend.sh
```

**Or manually:**
1. Go to [railway.app](https://railway.app) → Sign in with GitHub
2. "New Project" → "Deploy from GitHub repo"
3. Select `amanop29/DRIVEGUARD-AI`
4. Railway detects Dockerfile automatically
5. Add environment variables:
   ```
   NODE_ENV=production
   PORT=3001
   FRONTEND_URL=https://amanop29.github.io/DRIVEGUARD-AI
   ```
6. Click "Deploy" → Wait 3-5 minutes
7. Copy your backend URL (e.g., `https://driveguard-ai-production.up.railway.app`)

#### Option 2: Render.com (Free Tier Available)

**Why Render?**
- ✅ Free tier available (with limitations)
- ✅ Docker support
- ⚠️ Spins down after 15min inactivity (free tier)
- 💰 $7/month for always-on

**Deploy Steps:**
1. Go to [render.com](https://render.com) → Sign in with GitHub
2. "New +" → "Web Service"
3. Connect repo: `amanop29/DRIVEGUARD-AI`
4. Configure:
   - **Environment**: Docker
   - **Branch**: main
   - **Environment Variables**: Same as Railway above
5. Click "Create Web Service"
6. Wait for deployment (5-7 minutes)
7. Copy your service URL

#### Option 3: Docker (Self-Hosted/Cloud)

**For AWS, DigitalOcean, or Local Hosting:**

```bash
# Build the optimized image
cd backend
docker build -t driveguard-backend .

# Run container
docker run -d \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e FRONTEND_URL=https://amanop29.github.io/DRIVEGUARD-AI \
  --name driveguard-backend \
  driveguard-backend

# Check logs
docker logs driveguard-backend

# Test health endpoint
curl http://localhost:3001/api/health
```

**Image Details:**
- Base: `node:20-slim`
- Size: ~1.5-2GB (optimized from 12GB)
- Python deps: opencv-headless, numpy, ultralytics, scipy
- Node deps: express, multer, cors

### Connect Frontend to Backend

After deploying backend, update frontend to use it:

1. **Get your backend URL** from Railway/Render dashboard

2. **Update API configuration:**
   - Open `frontend/src/App.tsx` or API config file
   - Find `API_BASE_URL` constant
   - Replace with your backend URL:
     ```typescript
     const API_BASE_URL = 'https://your-backend-url.railway.app';
     ```

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "Connect frontend to production backend"
   git push origin main
   ```

4. **Wait for auto-deploy** (2-3 minutes)

5. **Test end-to-end:**
   - Visit https://amanop29.github.io/DRIVEGUARD-AI/
   - Upload a test video
   - Verify analysis completes

### Cost Comparison

| Platform | Free Tier | Paid Tier | Best For |
|----------|-----------|-----------|----------|
| **Railway** | $5 credit/month | $5/month+ | Development & Production |
| **Render** | 750 hrs/month | $7/month | Small projects |
| **GitHub Pages** | Unlimited | FREE | Frontend hosting |
| **Docker (self-host)** | - | Server costs | Full control |

### Deployment Troubleshooting

**Issue: Backend build fails**
- Check Docker logs in Railway/Render dashboard
- Verify `requirements.minimal.txt` exists
- Ensure `PIP_BREAK_SYSTEM_PACKAGES=1` is in Dockerfile

**Issue: Video upload fails**
- Check backend health: `curl https://your-backend/api/health`
- Verify CORS is configured (already set up)
- Check file size limit (500MB max)

**Issue: Analysis not running**
- Check Python dependencies installed
- View backend logs for Python errors
- Ensure YOLO model downloads successfully

**Issue: Frontend not updating**
- Check GitHub Actions for deployment status
- Clear browser cache (Ctrl+Shift+R)
- Verify changes pushed to `main` branch

## �📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 💬 Support

Having issues? Check:
1. Documentation files
2. Troubleshooting section
3. Error messages in console
4. Browser developer tools

---

**Made with ❤️ for safer driving**

**Version**: 1.0.0  
**Last Updated**: OCTOBER 2025  
**Status**: 🟢 Production Ready (Development Mode)
  

## 📚 Project Structure

```
DRIVEGUARD-AI/
├── frontend/                    # React + TypeScript Frontend
│   ├── src/components/         # React components
│   ├── src/utils/              # Utility functions
│   └── vite.config.ts          # Vite configuration
├── backend/                     # Node.js + Python Backend
│   ├── server.js               # Express API server
│   ├── analysis/               # Python analysis scripts
│   ├── config/                 # Configuration files
│   ├── Dockerfile              # Production container
│   └── package.json            # Backend dependencies
├── docs/                        # Documentation
├── .github/workflows/           # CI/CD
└── deploy-backend.sh            # Deployment helper
```

## 🔧 Technology Stack

**Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Recharts  
**Backend**: Node.js 20 + Express + Python 3.10  
**AI/CV**: OpenCV + YOLOv8 + NumPy + SciPy  
**Infrastructure**: GitHub Pages + Railway/Render + Docker  

## 📖 Documentation

- [Backend Documentation](./docs/BACKEND_DOCUMENTATION.md)
- [Frontend Documentation](./docs/FRONTEND_DOCUMENTATION.md)
- [Video Analysis Workflow](./docs/HOW_VIDEO_UPLOAD_AND_ANALYSIS_WORKS.md)
- [Non-Functional Requirements](./docs/NON_FUNCTIONAL_REQUIREMENTS.md)
