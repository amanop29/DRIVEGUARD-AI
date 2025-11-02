# Railway Deployment Notes

## ⚠️ Image Size Limitation

Railway's free tier has a **4.8 GB Docker image limit**.

### Current Issue

The full DriveGuard AI backend with:
- YOLOv8 (ultralytics)
- PyTorch
- Full OpenCV

Results in a **~8-12 GB** Docker image, which exceeds the limit.

### Solutions

#### Option 1: Use Railway Pro ($5/month)
- Upgrade to Railway Pro for larger image sizes
- Full functionality with YOLO object detection
- Recommended for production use

#### Option 2: Ultra-Minimal Build (Current)
- Removed PyTorch and ultralytics
- Only OpenCV for basic video processing
- Image size: ~1.5-2 GB ✅
- **Limitation**: No YOLO object detection (close encounter analysis disabled)
- Still provides:
  - Video upload
  - Basic speed analysis
  - Traffic light detection (color-based)
  - Lane change detection

#### Option 3: Use Render.com
- Render has no Docker image size limit on free tier
- Full functionality available
- Downside: Spins down after 15min inactivity

#### Option 4: Hybrid Approach
- Deploy lightweight backend on Railway (free)
- Run YOLO analysis locally when needed
- Upload pre-analyzed results to backend

### Recommended Approach

For **demo/portfolio**: Use Option 2 (ultra-minimal)
For **production**: Use Option 1 (Railway Pro) or Option 3 (Render paid tier)

### To Enable Full YOLO Functionality

If you upgrade to Railway Pro or switch to Render:

1. Update `backend/config/requirements.minimal.txt`:
   ```
   numpy
   opencv-python-headless
   ultralytics
   scipy
   ```

2. The Dockerfile will automatically use the full dependencies

3. Redeploy to Railway/Render
