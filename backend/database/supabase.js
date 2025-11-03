// Supabase Database Client
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for backend

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase credentials not found. Using local JSON storage.');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Database helper functions
const db = {
  // Check if Supabase is configured
  isConfigured: () => supabase !== null,

  // User operations
  users: {
    // Create new user
    async create(userData) {
      const { email, password, firstName, lastName, company, accountType, businessType, carNumber } = userData;
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      const { data, error } = await supabase
        .from('users')
        .insert([{
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          company: company || null,
          account_type: accountType || 'individual',
          business_type: businessType || null,
          car_number: carNumber || null
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    // Find user by email
    async findByEmail(email) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data;
    },

    // Verify password
    async verifyPassword(email, password) {
      const user = await this.findByEmail(email);
      if (!user) return null;
      
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) return null;
      
      return user;
    },

    // Update last login
    async updateLastLogin(userId) {
      const { data, error } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    // Update user profile
    async update(userId, updates) {
      const allowedFields = {
        first_name: updates.firstName,
        last_name: updates.lastName,
        company: updates.company,
        car_number: updates.carNumber,
        account_type: updates.accountType,
        business_type: updates.businessType
      };

      // Remove undefined values
      Object.keys(allowedFields).forEach(key => 
        allowedFields[key] === undefined && delete allowedFields[key]
      );

      const { data, error } = await supabase
        .from('users')
        .update(allowedFields)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    // Get all users (admin)
    async getAll() {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, company, account_type, business_type, car_number, status, created_at, last_login')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  },

  // Video operations
  videos: {
    // Create video record
    async create(videoData) {
      const { userId, filename, originalFilename, fileSize, storageUrl, storagePath } = videoData;
      
      const { data, error } = await supabase
        .from('videos')
        .insert([{
          user_id: userId,
          filename,
          original_filename: originalFilename,
          file_size: fileSize,
          storage_url: storageUrl,
          storage_path: storagePath,
          upload_status: 'uploaded'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    // Get user's videos
    async getByUserId(userId, limit = 50) {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    },

    // Update video status
    async updateStatus(videoId, status) {
      const { data, error } = await supabase
        .from('videos')
        .update({ upload_status: status })
        .eq('id', videoId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    // Get video by filename
    async findByFilename(filename) {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('filename', filename)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    // Update storage info
    async updateStorageInfo(videoId, storageInfo) {
      const { data, error } = await supabase
        .from('videos')
        .update({
          storage_url: storageInfo.storageUrl,
          storage_path: storageInfo.storagePath
        })
        .eq('id', videoId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Analysis operations
  analyses: {
    // Create analysis record
    async create(analysisData) {
      const {
        videoId,
        userId,
        analysisId,
        carNumber,
        driverId,
        vehicleId,
        organizationName,
        overallScore,
        speedScore,
        trafficScore,
        proximityScore,
        avgSpeed,
        maxSpeed,
        speedLimit,
        speedingDuration,
        speedingPercentage,
        redLightViolations,
        stopSignViolations,
        closeEncounters,
        dangerousProximities,
        speedData,
        trafficData,
        proximityData,
        frameByFrameData
      } = analysisData;
      
      const { data, error } = await supabase
        .from('video_analyses')
        .insert([{
          video_id: videoId,
          user_id: userId,
          analysis_id: analysisId,
          car_number: carNumber,
          driver_id: driverId,
          vehicle_id: vehicleId,
          organization_name: organizationName,
          overall_score: overallScore,
          speed_score: speedScore,
          traffic_score: trafficScore,
          proximity_score: proximityScore,
          avg_speed: avgSpeed,
          max_speed: maxSpeed,
          speed_limit: speedLimit,
          speeding_duration: speedingDuration,
          speeding_percentage: speedingPercentage,
          red_light_violations: redLightViolations || 0,
          stop_sign_violations: stopSignViolations || 0,
          total_traffic_violations: (redLightViolations || 0) + (stopSignViolations || 0),
          close_encounters: closeEncounters || 0,
          dangerous_proximities: dangerousProximities || 0,
          speed_data: speedData,
          traffic_data: trafficData,
          proximity_data: proximityData,
          frame_by_frame_data: frameByFrameData,
          processing_status: 'completed'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    // Get user's analyses
    async getByUserId(userId, limit = 50) {
      const { data, error } = await supabase
        .from('video_analyses')
        .select(`
          *,
          videos (
            filename,
            original_filename,
            storage_url,
            duration
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    },

    // Get analysis by ID
    async getById(analysisId) {
      const { data, error } = await supabase
        .from('video_analyses')
        .select(`
          *,
          videos (
            filename,
            original_filename,
            storage_url,
            duration
          )
        `)
        .eq('analysis_id', analysisId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    // Get statistics for user
    async getStats(userId) {
      const { data, error } = await supabase
        .from('video_analyses')
        .select('overall_score, speed_score, traffic_score, proximity_score, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return {
          totalAnalyses: 0,
          averageScore: 0,
          averageSpeedScore: 0,
          averageTrafficScore: 0,
          averageProximityScore: 0,
          recentAnalyses: []
        };
      }

      const avgScore = data.reduce((sum, a) => sum + (a.overall_score || 0), 0) / data.length;
      const avgSpeedScore = data.reduce((sum, a) => sum + (a.speed_score || 0), 0) / data.length;
      const avgTrafficScore = data.reduce((sum, a) => sum + (a.traffic_score || 0), 0) / data.length;
      const avgProximityScore = data.reduce((sum, a) => sum + (a.proximity_score || 0), 0) / data.length;

      return {
        totalAnalyses: data.length,
        averageScore: Math.round(avgScore),
        averageSpeedScore: Math.round(avgSpeedScore),
        averageTrafficScore: Math.round(avgTrafficScore),
        averageProximityScore: Math.round(avgProximityScore),
        recentAnalyses: data.slice(0, 10)
      };
    }
  },

  // Storage operations (for video files)
  storage: {
    // Upload video to Supabase storage
    async uploadVideo(file, userId, filename) {
      const filePath = `${userId}/${Date.now()}_${filename}`;
      
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          contentType: file.mimetype,
          upsert: false
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);
      
      return {
        path: filePath,
        url: publicUrl
      };
    },

    // Get video URL
    async getVideoUrl(filePath) {
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);
      
      return publicUrl;
    },

    // Delete video
    async deleteVideo(filePath) {
      const { data, error } = await supabase.storage
        .from('videos')
        .remove([filePath]);
      
      if (error) throw error;
      return data;
    }
  }
};

module.exports = { supabase, db };
