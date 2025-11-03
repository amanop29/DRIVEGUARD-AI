const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import Supabase database functions
const { db } = require('./database/supabase');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend
app.use(cors());
app.use(express.json());

// Serve static files (videos) with CORS headers
app.use('/videos', cors(), express.static(path.join(__dirname, 'videos'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Accept-Ranges', 'bytes');
  }
}));
app.use('/outputs', cors(), express.static(path.join(__dirname, 'outputs')));

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files (mp4, avi, mov) are allowed!'));
    }
  }
});

// Store processing status
const processingJobs = new Map();

// ============================================================================
// FALLBACK: JSON File Storage (when Supabase not configured)
// ============================================================================
const readUsersFromFile = () => {
  try {
    const usersPath = path.join(__dirname, 'data', 'users.json');
    if (fs.existsSync(usersPath)) {
      const data = fs.readFileSync(usersPath, 'utf8');
      return JSON.parse(data);
    }
    return { users: [] };
  } catch (error) {
    console.error('Error reading users file:', error);
    return { users: [] };
  }
};

const writeUsersToFile = (usersData) => {
  try {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const usersPath = path.join(dataDir, 'users.json');
    fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing users file:', error);
    return false;
  }
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'DriveGuard AI Backend is running',
    database: db.isConfigured() ? 'Supabase' : 'Local JSON',
    supabase: db.isConfigured()
  });
});

// User registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      company,
      accountType,
      businessType,
      carNumber
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: firstName, lastName, email, password' 
      });
    }

    // Use Supabase if configured, otherwise use JSON
    if (db.isConfigured()) {
      try {
        // Check if user exists
        const existingUser = await db.users.findByEmail(email);
        if (existingUser) {
          return res.status(409).json({ 
            success: false, 
            error: 'User with this email already exists' 
          });
        }

        // Create user in Supabase
        const newUser = await db.users.create({
          email,
          password,
          firstName,
          lastName,
          company,
          accountType,
          businessType,
          carNumber
        });

        // Remove password hash from response
        const { password_hash, ...userWithoutPassword } = newUser;
        res.json({
          success: true,
          message: 'User registered successfully',
          user: userWithoutPassword,
          storage: 'supabase'
        });
      } catch (error) {
        console.error('Supabase registration error:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to register user in database' 
        });
      }
    } else {
      // Fallback to JSON storage
      const usersData = readUsersFromFile();
      const existingUser = usersData.users.find(user => user.email === email);
      
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          error: 'User with this email already exists' 
        });
      }

      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        firstName,
        lastName,
        email,
        password,
        company: company || '',
        accountType: accountType || 'individual',
        businessType: businessType || null,
        carNumber: carNumber || '',
        organizationId: accountType === 'enterprise' ? `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        status: 'active',
        analyses: []
      };

      usersData.users.push(newUser);
      const writeSuccess = writeUsersToFile(usersData);

      if (writeSuccess) {
        const { password: _, ...userWithoutPassword } = newUser;
        res.json({
          success: true,
          message: 'User registered successfully',
          user: userWithoutPassword,
          storage: 'json'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to save user data'
        });
      }
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during registration' 
    });
  }
});

// User login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Use Supabase if configured
    if (db.isConfigured()) {
      try {
        const user = await db.users.verifyPassword(email, password);
        
        if (!user) {
          return res.status(401).json({ 
            success: false, 
            error: 'Invalid email or password' 
          });
        }

        // Update last login
        await db.users.updateLastLogin(user.id);

        const { password_hash, ...userWithoutPassword } = user;
        res.json({
          success: true,
          message: 'Login successful',
          user: userWithoutPassword,
          storage: 'supabase'
        });
      } catch (error) {
        console.error('Supabase login error:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to authenticate' 
        });
      }
    } else {
      // Fallback to JSON storage
      const usersData = readUsersFromFile();
      const user = usersData.users.find(u => u.email === email && u.password === password);

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid email or password' 
        });
      }

      user.lastLogin = new Date().toISOString();
      writeUsersToFile(usersData);

      const { password: _, ...userWithoutPassword } = user;
      res.json({
        success: true,
        message: 'Login successful',
        user: userWithoutPassword,
        storage: 'json'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during login' 
    });
  }
});

// Get user's analysis history
app.get('/api/user-analyses/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);

    if (db.isConfigured()) {
      try {
        const user = await db.users.findByEmail(email);
        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'User not found'
          });
        }

        const analyses = await db.analyses.getByUserId(user.id);
        res.json({
          success: true,
          count: analyses.length,
          analyses: analyses,
          storage: 'supabase'
        });
      } catch (error) {
        console.error('Supabase get analyses error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch analyses'
        });
      }
    } else {
      // Fallback to JSON
      const usersData = readUsersFromFile();
      const user = usersData.users.find(u => u.email === email);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        count: user.analyses ? user.analyses.length : 0,
        analyses: user.analyses || [],
        storage: 'json'
      });
    }
  } catch (error) {
    console.error('Get analyses error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user analyses'
    });
  }
});

// Save analysis to user's history
app.post('/api/save-analysis', async (req, res) => {
  try {
    const { email, analysisData } = req.body;

    if (!email || !analysisData) {
      return res.status(400).json({
        success: false,
        error: 'Email and analysis data are required'
      });
    }

    if (db.isConfigured()) {
      try {
        const user = await db.users.findByEmail(email);
        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'User not found'
          });
        }

        // Find or create video record
        let video = await db.videos.findByFilename(analysisData.fileName);
        if (!video) {
          video = await db.videos.create({
            userId: user.id,
            filename: analysisData.fileName,
            originalFilename: analysisData.fileName,
            fileSize: 0,
            storageUrl: `/videos/${analysisData.fileName}`,
            storagePath: `/videos/${analysisData.fileName}`
          });
        }

        // Create analysis record
        await db.analyses.create({
          videoId: video.id,
          userId: user.id,
          analysisId: analysisData.id || `${Date.now()}`,
          carNumber: analysisData.carNumber,
          driverId: analysisData.driverId,
          vehicleId: analysisData.vehicleId,
          organizationName: analysisData.organizationName,
          overallScore: analysisData.score,
          speedScore: analysisData.speedScore || analysisData.score,
          trafficScore: analysisData.trafficScore || 100,
          proximityScore: analysisData.proximityScore || 100,
          speedData: analysisData.speedData || {},
          trafficData: analysisData.trafficData || {},
          proximityData: analysisData.proximityData || {},
          frameByFrameData: analysisData.frameByFrameData || {}
        });

        res.json({
          success: true,
          message: 'Analysis saved to database',
          storage: 'supabase'
        });
      } catch (error) {
        console.error('Supabase save analysis error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to save analysis'
        });
      }
    } else {
      // Fallback to JSON
      const usersData = readUsersFromFile();
      const user = usersData.users.find(u => u.email === email);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (!user.analyses) {
        user.analyses = [];
      }

      const newAnalysis = {
        ...analysisData,
        savedAt: new Date().toISOString()
      };

      user.analyses.unshift(newAnalysis);
      const writeSuccess = writeUsersToFile(usersData);

      if (writeSuccess) {
        res.json({
          success: true,
          message: 'Analysis saved to user history',
          analysisCount: user.analyses.length,
          storage: 'json'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to save analysis'
        });
      }
    }
  } catch (error) {
    console.error('Save analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while saving analysis'
    });
  }
});

// Video upload and processing endpoint
app.post('/api/upload-video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const videoFilename = req.file.filename;
    const jobId = Date.now().toString();

    processingJobs.set(jobId, {
      status: 'processing',
      filename: videoFilename,
      progress: 0,
      message: 'Video uploaded, starting analysis...'
    });

    res.json({
      success: true,
      jobId: jobId,
      filename: videoFilename,
      message: 'Video uploaded successfully. Processing started.'
    });

    processVideo(jobId, videoFilename);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check processing status
app.get('/api/status/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const job = processingJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(job);
});

// Get analysis results
app.get('/api/results/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const stem = path.parse(filename).name;
    const resultPath = path.join(__dirname, 'outputs', 'analysis', `${stem}_analysis.json`);

    if (!fs.existsSync(resultPath)) {
      return res.status(404).json({ error: 'Analysis results not found' });
    }

    const results = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
    res.json(results);
  } catch (error) {
    console.error('Results error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process video with Python script
function processVideo(jobId, videoFilename) {
  const pythonScript = path.join(__dirname, 'analysis', 'analyze_video_single.py');
  const videoPath = path.join(__dirname, 'videos', videoFilename);

  console.log(`Starting analysis for ${videoFilename}...`);

  processingJobs.set(jobId, {
    status: 'processing',
    filename: videoFilename,
    progress: 10,
    message: 'Analyzing video with AI models...'
  });

  const pythonProcess = spawn('python3', [pythonScript, videoPath, videoFilename]);

  let outputData = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => {
    const output = data.toString();
    outputData += output;
    console.log(`Python stdout: ${output}`);

    if (output.includes('average speed')) {
      processingJobs.get(jobId).progress = 30;
      processingJobs.get(jobId).message = 'Calculating speed...';
    } else if (output.includes('traffic signals')) {
      processingJobs.get(jobId).progress = 50;
      processingJobs.get(jobId).message = 'Detecting traffic signals...';
    } else if (output.includes('close encounters')) {
      processingJobs.get(jobId).progress = 70;
      processingJobs.get(jobId).message = 'Analyzing close encounters...';
    } else if (output.includes('driving scores')) {
      processingJobs.get(jobId).progress = 90;
      processingJobs.get(jobId).message = 'Calculating driving scores...';
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
    console.error(`Python stderr: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    if (code === 0) {
      console.log(`Analysis complete for ${videoFilename}`);
      
      const stem = path.parse(videoFilename).name;
      const resultPath = path.join(__dirname, 'outputs', 'analysis', `${stem}_analysis.json`);
      
      try {
        const results = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
        
        processingJobs.set(jobId, {
          status: 'completed',
          filename: videoFilename,
          progress: 100,
          message: 'Analysis completed successfully!',
          results: results
        });
      } catch (error) {
        console.error('Error reading results:', error);
        processingJobs.set(jobId, {
          status: 'failed',
          filename: videoFilename,
          progress: 0,
          message: 'Failed to read analysis results',
          error: error.message
        });
      }
    } else {
      console.error(`Python process exited with code ${code}`);
      processingJobs.set(jobId, {
        status: 'failed',
        filename: videoFilename,
        progress: 0,
        message: 'Analysis failed',
        error: errorData || 'Unknown error occurred'
      });
    }
  });

  pythonProcess.on('error', (error) => {
    console.error('Failed to start Python process:', error);
    processingJobs.set(jobId, {
      status: 'failed',
      filename: videoFilename,
      progress: 0,
      message: 'Failed to start analysis',
      error: error.message
    });
  });
}

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 DriveGuard AI Backend Server');
  console.log('='.repeat(60));
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`💾 Database: ${db.isConfigured() ? 'Supabase ✅' : 'Local JSON ⚠️'}`);
  console.log(`📊 API Endpoints:`);
  console.log(`   - POST /api/register (user registration)`);
  console.log(`   - POST /api/login (user authentication)`);
  console.log(`   - POST /api/upload-video (upload & analyze video)`);
  console.log(`   - POST /api/save-analysis (save analysis to user)`);
  console.log(`   - GET  /api/user-analyses/:email (get user's analyses)`);
  console.log(`   - GET  /api/status/:jobId (check processing status)`);
  console.log(`   - GET  /api/results/:filename (get analysis results)`);
  console.log(`   - GET  /api/health (health check)`);
  console.log('='.repeat(60));
  
  if (!db.isConfigured()) {
    console.log('⚠️  WARNING: Supabase not configured, using local JSON storage');
    console.log('   Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env file');
  }
});
