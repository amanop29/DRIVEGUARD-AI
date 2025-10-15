# DriveGuard AI - Complete System Workflow

**Presentation Documentation**  
**Date:** October 9, 2025  
**Structure:** Reorganized Frontend/Backend

---

## 🎯 System Overview

DriveGuard AI is an intelligent dashcam video analysis platform that uses computer vision and machine learning to evaluate driving behavior and detect safety violations.

### **Technology Stack**
- **Frontend:** React + TypeScript + Vite + Tailwind CSS → `/frontend/`
- **Backend API:** Node.js + Express → `/backend/server.js`
- **Analysis Engine:** Python 3 + OpenCV + YOLOv8 + PyTorch → `/backend/analysis/`
- **GPU Acceleration:** Apple Silicon MPS (Metal Performance Shaders)

### **New Project Structure**
```
DRIVEGUARD AI/
├── backend/          # All backend code
│   ├── analysis/    # Python AI modules
│   ├── server.js    # Node.js API
│   └── ...
├── frontend/        # All frontend code
│   └── src/         # React components
└── docs/            # Documentation
```

---

## 📹 Complete Video Upload & Analysis Workflow

### **Step 1: User Uploads Video (Frontend)**

```
┌─────────────────────────────────────────────────────────┐
│  User Interface (React)                                 │
│  ├─ Upload Component                                    │
│  ├─ File validation (MP4, max 500MB)                    │
│  └─ Progress indicator                                  │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
              POST /api/analyze
              (multipart/form-data)
```

**Frontend Code Flow:**
```typescript
// User selects video file
const handleVideoUpload = async (file: File) => {
  // 1. Validate file
  if (!file.name.endsWith('.mp4')) {
    toast.error('Please upload MP4 files only');
    return;
  }
  
  // 2. Create FormData
  const formData = new FormData();
  formData.append('video', file);
  formData.append('userId', userData.id);
  formData.append('userEmail', userData.email);
  
  // 3. Upload with progress tracking
  const response = await fetch('http://localhost:3001/api/analyze', {
    method: 'POST',
    body: formData
  });
}
```

---

### **Step 2: Backend Receives Request (Node.js)**

```
┌─────────────────────────────────────────────────────────┐
│  Express Server (Port 3001)                             │
│  ├─ Multer middleware (file handling)                   │
│  ├─ Save to /videos/ directory                          │
│  └─ Trigger Python analysis script                      │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
          spawn('python3 scripts/analyze_single_video.py')
```

**Backend Code Flow:**
```javascript
// server.js
app.post('/api/analyze', upload.single('video'), async (req, res) => {
  const videoPath = req.file.path;  // videos/dashcam.mp4
  const fileName = req.file.originalname;
  
  // Execute Python analysis
  const pythonProcess = spawn('python3', [
    'scripts/analyze_single_video.py',
    videoPath,
    fileName
  ]);
  
  // Stream analysis progress to frontend
  pythonProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  // Return results when complete
  pythonProcess.on('close', (code) => {
    const analysisData = readAnalysisJSON(fileName);
    res.json(analysisData);
  });
});
```

---

### **Step 3: Python Analysis Engine**

```
┌──────────────────────────────────────────────────────────────┐
│  Analysis Pipeline (main_v2.py)                              │
│                                                               │
│  1. Video Metadata Extraction                                │
│     ├─ Duration, FPS, Resolution                             │
│     └─ Frame count                                           │
│                                                               │
│  2. Speed Detection (Enhanced Multi-Method)                  │
│     ├─ Optical flow analysis                                 │
│     ├─ Feature tracking (Lucas-Kanade)                       │
│     └─ Dynamic scale estimation                              │
│                                                               │
│  3. Traffic Signal Detection                                 │
│     ├─ YOLOv8 object detection                               │
│     ├─ Color analysis (HSV color space)                      │
│     └─ Violation timing                                      │
│                                                               │
│  4. Close Encounter Detection (Enhanced)                     │
│     ├─ Vehicle tracking with persistent IDs                  │
│     ├─ Distance estimation (pinhole camera model)            │
│     ├─ Time-to-collision (TTC) calculation                   │
│     └─ Danger scoring                                        │
│                                                               │
│  5. Turn Detection                                           │
│     ├─ ORB feature matching                                  │
│     └─ Rotation matrix calculation                           │
│                                                               │
│  6. Lane Change Detection                                    │
│     ├─ Optical flow (Farneback)                              │
│     ├─ Lateral movement analysis                             │
│     └─ Sustained movement validation                         │
│                                                               │
│  7. Bus Lane Violation Detection                             │
│     ├─ Red color detection (HSV thresholds)                  │
│     └─ Coverage percentage calculation                       │
│                                                               │
│  8. Driving Score Calculation                                │
│     ├─ Safety Score (0-100)                                  │
│     ├─ Compliance Score (0-100)                              │
│     ├─ Efficiency Score (0-100)                              │
│     └─ Overall Score (weighted average)                      │
│                                                               │
│  9. Save Analysis Results                                    │
│     ├─ outputs/analysis/{filename}_analysis.json             │
│     └─ public/outputs/ (for frontend access)                 │
└──────────────────────────────────────────────────────────────┘
```

**Analysis Output Example:**
```json
{
  "video_filename": "dashcam.mp4",
  "video_metadata": {
    "duration_seconds": 149.6,
    "fps": 30.0,
    "resolution": {"width": 1280, "height": 720}
  },
  "average_speed_kmph": 44.5,
  "safety_violation": 1,
  "close_encounters": {
    "close_encounters": [
      {
        "start_time": 3.53,
        "end_time": 5.2,
        "peak_score": 0.426,
        "where": "left",
        "min_distance_m": 2.81,
        "ttc_sec": 1.13
      }
    ],
    "event_count": 13
  },
  "traffic_signal_summary": {
    "violations": [],
    "violation": false
  },
  "lane_change_count": {
    "turn_count": 5,
    "left": 2,
    "right": 3
  },
  "driving_scores": {
    "overall_score": 37,
    "safety_score": 0,
    "compliance_score": 70,
    "efficiency_score": 82
  }
}
```

---

### **Step 4: Frontend Displays Results**

```
┌─────────────────────────────────────────────────────────┐
│  Analysis Dashboard (React Components)                  │
│                                                          │
│  ├─ Performance Metrics Cards                           │
│  │   ├─ Average Speed                                   │
│  │   ├─ Close Encounters                                │
│  │   ├─ Traffic Violations                              │
│  │   ├─ Lane Changes                                    │
│  │   └─ Overall Violations                              │
│  │                                                       │
│  ├─ Interactive Video Player                            │
│  │   ├─ Timeline with event markers                     │
│  │   ├─ Event filtering                                 │
│  │   ├─ Playback controls                               │
│  │   └─ Event cards                                     │
│  │                                                       │
│  ├─ Analysis Charts                                     │
│  │   ├─ Speed over time                                 │
│  │   ├─ Safety metrics                                  │
│  │   └─ Comparative analysis                            │
│  │                                                       │
│  ├─ AI-Generated Summary                                │
│  │   ├─ Strengths & Focus Areas                         │
│  │   ├─ Detailed insights                               │
│  │   └─ Recommendations                                 │
│  │                                                       │
│  └─ Export Options                                      │
│      ├─ PDF report                                      │
│      └─ CSV data                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Performance Metrics Explained

### **1. Average Speed (km/h)**
**How it's calculated:**
- Optical flow analysis on road surface
- Feature tracking (300+ points)
- Dynamic scale estimation based on distance
- Median filtering for outliers

**Scale Factors:**
- Far region (horizon): 1.0 m/px
- Mid region (road): 0.65 m/px
- Near region (close): 0.40 m/px

**Status Indicators:**
- ✅ Green: Within speed limits
- ⚠️ Yellow: Slightly over limit
- ❌ Red: Significantly speeding

---

### **2. Close Encounters (events)**
**How it's detected:**
- YOLOv8 vehicle detection and tracking
- Distance estimation using pinhole camera model:
  ```
  distance = (real_height × focal_length) / box_height_px
  ```
- Time-to-collision (TTC) calculation from trajectory
- Lateral movement filtering (ignores passing vehicles)

**Danger Scoring:**
```python
score = distance_factor × 0.5 + ttc_factor × 0.3 + box_factor × 0.2
```

**Thresholds:**
- Dangerous: < 15 meters
- Critical: < 8 meters
- TTC warning: < 4 seconds

---

### **3. Traffic Violations**
**Detection Methods:**
- Traffic light detection (YOLO + color analysis)
- Red light violation timing
- Stop sign detection
- Temporal validation (minimum 0.5s violation)

**Status:**
- ✅ 0 violations: Good
- ⚠️ 1-2 violations: Warning
- ❌ 3+ violations: Danger

---

### **4. Lane Changes**
**Detection Algorithm:**
- Farneback optical flow analysis
- ROI: Center 30% of frame (40-65% height)
- Horizontal motion detection with validation:
  - Motion must cover >25% of ROI
  - Horizontal movement >2x vertical
  - Sustained for 2+ seconds

**Thresholds:**
- Entry threshold: 0.75
- Exit threshold: 0.40
- Minimum duration: 2.0 seconds

---

### **5. Bus Lane Violations**
**Detection Method:**
- HSV color space analysis
- Red color detection (0-10° and 170-180° hue)
- Coverage percentage in ROI
- Minimum coverage: 12%

---

### **6. Overall Violations (total)**
**Calculation:**
```python
violations = traffic_violations + bus_lane_violations
# Note: Close encounters tracked separately
```

---

### **7. Driving Scores**

#### **Safety Score (0-100)**
```python
base_score = 100
deductions = (close_encounters × 8) + (traffic_violations × 15)
safety_score = max(0, base_score - deductions)
```

#### **Compliance Score (0-100)**
```python
base_score = 100
deductions = (traffic_violations × 20) + (bus_violations × 15)
compliance_score = max(0, base_score - deductions)
```

#### **Efficiency Score (0-100)**
```python
base_score = 100
deductions = (excessive_lane_changes × 2) + speed_penalty
efficiency_score = max(0, base_score - deductions)
```

#### **Overall Score (weighted average)**
```python
overall = (safety × 0.4) + (compliance × 0.3) + (efficiency × 0.3)
```

**Categories:**
- 🏆 **90-100:** Excellent
- ✅ **70-89:** Good
- ⚠️ **50-69:** Needs Improvement
- ❌ **0-49:** Poor

---

## 🔄 Data Flow Architecture

```
┌────────────┐       ┌────────────┐       ┌────────────┐
│  Frontend  │──────▶│  Backend   │──────▶│   Python   │
│  (React)   │       │ (Node.js)  │       │  Analysis  │
│   Port     │◀──────│   Port     │◀──────│   Engine   │
│   5173     │       │   3001     │       │            │
└────────────┘       └────────────┘       └────────────┘
      │                     │                     │
      │                     │                     │
      ▼                     ▼                     ▼
┌────────────┐       ┌────────────┐       ┌────────────┐
│  Browser   │       │   videos/  │       │  outputs/  │
│  Storage   │       │  uploads   │       │  analysis  │
└────────────┘       └────────────┘       └────────────┘
                            │                     │
                            └─────────────────────┘
                                      │
                                      ▼
                              ┌────────────┐
                              │  public/   │
                              │  outputs/  │
                              │  (static)  │
                              └────────────┘
```

---

## 🚀 Performance Optimizations

### **1. GPU Acceleration**
- Apple Silicon MPS for YOLOv8 inference
- 3-5x faster than CPU processing

### **2. Frame Sampling**
- Process every 3rd frame for optical flow
- Process every 5th frame for object detection
- Maintains accuracy while reducing compute time

### **3. Caching & Persistence**
- Analysis results cached in JSON
- Merged analysis file for quick dashboard loading
- Video metadata cached

### **4. Progressive Loading**
- Analysis progress streamed to frontend
- Real-time status updates
- Cancellable operations

---

## 🎨 User Experience Flow

```
1. Login/Register
   ├─ Email validation
   ├─ Account type selection
   └─ Redirect to dashboard

2. Upload Video
   ├─ Drag & drop or file picker
   ├─ File validation (type, size)
   ├─ Upload progress bar
   └─ Analysis queue

3. Analysis in Progress
   ├─ Real-time progress updates
   ├─ Estimated time remaining
   └─ Cancel option

4. View Results
   ├─ Performance metrics overview
   ├─ Interactive video player
   ├─ Detailed charts
   └─ AI-generated insights

5. Export & Share
   ├─ Download PDF report
   ├─ Export CSV data
   └─ Share with organization

6. History & Comparison
   ├─ View past analyses
   ├─ Compare multiple videos
   └─ Track improvements
```

---

## 🔐 Security & Data Management

### **File Upload Security**
- File type validation (MP4 only)
- Size limit: 500MB
- Unique filename generation
- Server-side validation

### **Data Storage**
- Videos: `/videos/` (server-side)
- Analysis: `/outputs/analysis/`
- User data: `/data/users.json`
- Public access: `/public/outputs/` (static serving)

### **Access Control**
- User authentication required
- Analysis tied to user account
- Organization-level data isolation

---

## 📈 Scalability Considerations

### **Current Architecture**
- Single-server deployment
- File-based storage
- JSON data persistence

### **Future Enhancements**
- **Database:** MongoDB/PostgreSQL for user data
- **Storage:** AWS S3/Azure Blob for videos
- **Processing:** Queue system (Bull/Celery) for async analysis
- **Caching:** Redis for session and result caching
- **Load Balancing:** Multiple analysis workers
- **Real-time:** WebSocket for live progress updates

---

## 🎯 Key Features Summary

✅ **Video Analysis**
- Dashcam footage processing
- Multi-metric evaluation
- Real-time progress tracking

✅ **AI-Powered Detection**
- Speed estimation
- Close encounter detection
- Traffic violation detection
- Lane change tracking

✅ **Interactive Dashboard**
- Video player with event markers
- Performance metrics visualization
- Comparative analysis

✅ **Export & Reporting**
- PDF report generation
- CSV data export
- Shareable insights

✅ **User Management**
- Individual & enterprise accounts
- Organization hierarchies
- Role-based access

---

**This workflow ensures accurate, fast, and user-friendly driving behavior analysis for fleet management, insurance, and individual drivers.**
