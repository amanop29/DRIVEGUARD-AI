const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Enable CORS for frontend
app.use(cors());
app.use(express.json());

// Serve static files (videos) with CORS headers
app.use('/videos', cors(), express.static(path.join(__dirname, 'videos'), {
  setHeaders: (res, filePath) => {
    // Set CORS headers explicitly for video files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    // Enable range requests for video streaming
    res.setHeader('Accept-Ranges', 'bytes');
  }
}));
app.use('/outputs', cors(), express.static(path.join(__dirname, 'outputs')));

// Serve the test page
app.use(express.static(path.join(__dirname)));

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
    // Use original filename
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

// Utility function to read users from JSON file
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

// Utility function to write users to JSON file
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DriveGuard AI Backend is running' });
});

// User registration endpoint
app.post('/api/register', (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      company,
      accountType,
      businessType,
      carNumber,
      affiliatedOrganizationId,
      affiliatedOrganizationName,
      affiliatedOrganizationType
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: firstName, lastName, email, password' 
      });
    }

    // Read existing users
    const usersData = readUsersFromFile();

    // Check if user already exists
    const existingUser = usersData.users.find(user => user.email === email);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: 'User with this email already exists' 
      });
    }

    // Create new user object
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      firstName,
      lastName,
      email,
      password, // In production, this should be hashed!
      company: company || '',
      accountType: accountType || 'individual',
      businessType: businessType || null,
      carNumber: carNumber || '',
      affiliatedOrganizationId: affiliatedOrganizationId || null,
      affiliatedOrganizationName: affiliatedOrganizationName || null,
      affiliatedOrganizationType: affiliatedOrganizationType || null,
      organizationId: accountType === 'enterprise' ? `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      status: 'active'
    };

    // Add user to array
    usersData.users.push(newUser);

    // Write to file
    const writeSuccess = writeUsersToFile(usersData);

    if (writeSuccess) {
      // Return user data without password
      const { password: _, ...userWithoutPassword } = newUser;
      res.json({
        success: true,
        message: 'User registered successfully',
        user: userWithoutPassword
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to save user data'
      });
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
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Read users
    const usersData = readUsersFromFile();

    // Find user
    const user = usersData.users.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    writeUsersToFile(usersData);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during login' 
    });
  }
});

// Get all users (admin endpoint)
app.get('/api/users', (req, res) => {
  try {
    const usersData = readUsersFromFile();
    // Return users without passwords
    const usersWithoutPasswords = usersData.users.map(({ password, ...user }) => user);
    res.json({
      success: true,
      count: usersWithoutPasswords.length,
      users: usersWithoutPasswords
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch users' 
    });
  }
});

// Save analysis to user's history
app.post('/api/save-analysis', (req, res) => {
  try {
    const { email, analysisData } = req.body;

    if (!email || !analysisData) {
      return res.status(400).json({
        success: false,
        error: 'Email and analysis data are required'
      });
    }

    const usersData = readUsersFromFile();
    const user = usersData.users.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Initialize analyses array if it doesn't exist
    if (!user.analyses) {
      user.analyses = [];
    }

    // Add new analysis with timestamp
    const newAnalysis = {
      ...analysisData,
      savedAt: new Date().toISOString()
    };

    user.analyses.unshift(newAnalysis); // Add to beginning of array

    // Save to file
    const writeSuccess = writeUsersToFile(usersData);

    if (writeSuccess) {
      res.json({
        success: true,
        message: 'Analysis saved to user history',
        analysisCount: user.analyses.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to save analysis'
      });
    }

  } catch (error) {
    console.error('Save analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while saving analysis'
    });
  }
});

// Get user's analysis history
app.get('/api/user-analyses/:email', (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);

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
      analyses: user.analyses || []
    });

  } catch (error) {
    console.error('Get analyses error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user analyses'
    });
  }
});

// Update user information
app.put('/api/update-user', (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      company,
      carNumber,
      accountType,
      businessType
    } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const usersData = readUsersFromFile();
    const userIndex = usersData.users.findIndex(u => u.email === email);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user fields (keep existing values if not provided)
    const user = usersData.users[userIndex];
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (company !== undefined) user.company = company;
    if (carNumber !== undefined) user.carNumber = carNumber;
    if (accountType !== undefined) user.accountType = accountType;
    if (businessType !== undefined) user.businessType = businessType;
    
    user.updatedAt = new Date().toISOString();

    // Save to file
    const writeSuccess = writeUsersToFile(usersData);

    if (writeSuccess) {
      // Return updated user without password
      const { password, ...userWithoutPassword } = user;
      res.json({
        success: true,
        message: 'User updated successfully',
        user: userWithoutPassword
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to save user data'
      });
    }

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating user'
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

    // Initialize job status
    processingJobs.set(jobId, {
      status: 'processing',
      filename: videoFilename,
      progress: 0,
      message: 'Video uploaded, starting analysis...'
    });

    // Send immediate response with job ID
    res.json({
      success: true,
      jobId: jobId,
      filename: videoFilename,
      message: 'Video uploaded successfully. Processing started.'
    });

    // Start Python analysis in background
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

// Get merged analysis data
app.get('/api/merged-analysis', (req, res) => {
  try {
    const mergedPath = path.join(__dirname, 'outputs', 'analysis', 'merged_output_analysis.json');
    
    if (!fs.existsSync(mergedPath)) {
      return res.status(404).json({ error: 'Merged analysis not found' });
    }

    const data = JSON.parse(fs.readFileSync(mergedPath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Merged analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process video with Python script
function processVideo(jobId, videoFilename) {
  const pythonScript = path.join(__dirname, 'analysis', 'analyze_video_single.py');
  const videoPath = path.join(__dirname, 'videos', videoFilename);

  console.log(`Starting analysis for ${videoFilename}...`);

  // Update job status
  processingJobs.set(jobId, {
    status: 'processing',
    filename: videoFilename,
    progress: 10,
    message: 'Analyzing video with AI models...'
  });

  // Spawn Python process
  const pythonProcess = spawn('python3', [pythonScript, videoPath, videoFilename]);

  let outputData = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => {
    const output = data.toString();
    outputData += output;
    console.log(`Python stdout: ${output}`);

    // Update progress based on output
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
      
      // Read the generated results
      const stem = path.parse(videoFilename).name;
      const resultPath = path.join(__dirname, 'outputs', 'analysis', `${stem}_analysis.json`);
      
      try {
        const results = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
        
        // Update merged analysis
        updateMergedAnalysis(videoFilename, results);
        
        // Update job status to completed
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

// Update merged analysis file
function updateMergedAnalysis(videoFilename, results) {
  try {
    const mergedPath = path.join(__dirname, 'outputs', 'analysis', 'merged_output_analysis.json');
    
    let mergedData = {};
    
    // Read existing merged data
    if (fs.existsSync(mergedPath)) {
      mergedData = JSON.parse(fs.readFileSync(mergedPath, 'utf8'));
    }
    
    // Add/update new video results
    mergedData[videoFilename] = results;
    
    // Write to single source of truth
    fs.writeFileSync(mergedPath, JSON.stringify(mergedData, null, 4));
    
    console.log(`✅ Updated merged analysis with ${videoFilename}`);
  } catch (error) {
    console.error('❌ Error updating merged analysis:', error);
  }
}

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 DriveGuard AI Backend Server');
  console.log('='.repeat(60));
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📊 API Endpoints:`);
  console.log(`   - POST /api/upload-video (upload & analyze video)`);
  console.log(`   - GET  /api/status/:jobId (check processing status)`);
  console.log(`   - GET  /api/results/:filename (get analysis results)`);
  console.log(`   - GET  /api/merged-analysis (get all results)`);
  console.log(`   - GET  /api/health (health check)`);
  console.log('='.repeat(60));
});
