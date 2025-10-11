# DRIVEGUARD AI 🚗💨

[![Status](https://img.shields.io/badge/status-operational-green)]()
[![Version](https://img.shields.io/badge/version-2.0.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-purple)]()
[![Structure](https://img.shields.io/badge/structure-reorganized-orange)]()

**AI-Powered Dashcam Video Analysis with Real-Time Processing**

DriveGuardAI analyzes dashcam footage to provide comprehensive driving safety scores, behavior insights, and actionable recommendations. Now with **real-time video processing** - upload any video and get instant analysis!

> **📦 NEW:** Project reorganized with clean Frontend/Backend structure (October 2025)

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

## 🚀 Quick Start

### Option 1: Automated Start (Recommended)
```bash
./start.sh
```
Starts both backend API and frontend dev server automatically!

### Option 2: Manual Start

**Backend Server:**
```bash
cd backend
node server.js
# Backend API running on http://localhost:3001
```

**Frontend Dev Server (in new terminal):**
```bash
cd frontend
npm run dev
# Frontend UI running on http://localhost:5173
```

**Python Analysis Only (no web interface):**
```bash
cd backend
python analysis/main_v2.py
# Processes all videos in backend/videos/
```

Then open **http://localhost:5173** and start uploading videos!

## 📋 Prerequisites

### Required Software
- **Node.js** v16+ ([Download](https://nodejs.org/))
- **Python** 3.8+ ([Download](https://www.python.org/))
- **npm** (comes with Node.js)

### System Requirements
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 20GB free space
- **OS**: macOS, Linux, or Windows
- **GPU**: Optional (for faster YOLO processing)

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

## 📁 Project Structure

```
/
├── server.js                           # Backend API server
├── start.sh                            # Quick start script
├── package.json                        # Node.js dependencies
├── README.md                           # This file
├── QUICK_START.md                      # Quick start guide
├── REALTIME_PROCESSING.md              # Detailed system docs
├── REALTIME_IMPLEMENTATION.md          # Implementation details
├── /videos/                            # Uploaded videos
├── /AD Aman/
│   ├── analyze_single_video.py         # Single video analysis
│   ├── main_v2.py                      # Core analysis engine
│   ├── driving_score_calculator.py     # Score calculation
│   ├── video_calibrations.json         # Calibration settings
│   ├── merged_output_analysis.json     # All results (backend)
│   └── {filename}_analysis.json        # Individual results
├── /public/AD Aman/
│   └── merged_output_analysis.json     # Frontend-accessible
└── /src/
    ├── App.tsx                         # Main app component
    ├── /components/
    │   ├── VideoUpload.tsx             # Upload interface
    │   ├── AnalysisDashboard.tsx       # Results dashboard
    │   ├── AnalysisCharts.tsx          # Interactive charts
    │   ├── DrivingScore.tsx            # Score display
    │   └── ...
    └── /utils/
        ├── analysisData.ts             # Data loading
        ├── videoScoreData.ts           # Score configuration
        └── speedChartData.ts           # Chart data
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

Original design by: https://www.figma.com/design/k05FZU8QC8vDABektPTXBx/DRIVEGUARD-AI

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

## 📄 License

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
**Last Updated**: January 2025  
**Status**: 🟢 Production Ready (Development Mode)
  