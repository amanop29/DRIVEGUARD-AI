/**
 * Backfill Script: Import existing analysis JSON files into Supabase
 * This will populate the database with all existing video analyses
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { db } = require('./database/supabase');

async function backfillAnalyses() {
  console.log('🔄 Starting backfill of analysis data to Supabase...\n');

  if (!db.isConfigured()) {
    console.error('❌ Supabase not configured! Check your .env file.');
    process.exit(1);
  }

  const analysisDir = path.join(__dirname, 'outputs', 'analysis');
  const files = fs.readdirSync(analysisDir).filter(f => f.endsWith('_analysis.json') && f !== 'merged_output_analysis.json');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(analysisDir, file);
    const videoFilename = file.replace('_analysis.json', '.mp4');
    
    try {
      console.log(`📄 Processing: ${videoFilename}...`);
      
      // Read analysis results
      const results = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Check if video already exists
      let video = await db.videos.findByFilename(videoFilename);
      
      if (!video) {
        // Create video record
        const videoPath = path.join(__dirname, 'videos', videoFilename);
        const stats = fs.existsSync(videoPath) ? fs.statSync(videoPath) : null;
        
        video = await db.videos.create({
          userId: null,
          filename: videoFilename,
          originalFilename: videoFilename,
          fileSize: stats ? stats.size : 0,
          storageUrl: `/videos/${videoFilename}`,
          storagePath: `/videos/${videoFilename}`
        });
        console.log(`  ✅ Video record created: ${video.id}`);
      } else {
        console.log(`  ℹ️  Video record already exists: ${video.id}`);
      }

      // Extract analysis data
      const drivingScores = results.driving_scores || {};
      const avgSpeed = results.average_speed_kmph || 0;
      const trafficSummary = results.traffic_signal_summary || {};
      const closeEncounters = results.close_encounters || {};
      
      // Create analysis record
      const analysis = await db.analyses.create({
        videoId: video.id,
        userId: null,
        analysisId: `analysis_backfill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        overallScore: drivingScores.overall_score || 0,
        speedScore: drivingScores.safety_score || 0,
        trafficScore: drivingScores.compliance_score || 0,
        proximityScore: drivingScores.efficiency_score || 0,
        avgSpeed: avgSpeed,
        speedLimit: null,
        speedingDuration: null,
        speedingPercentage: null,
        redLightViolations: trafficSummary.violations ? trafficSummary.violations.length : 0,
        stopSignViolations: 0,
        totalTrafficViolations: trafficSummary.violations ? trafficSummary.violations.length : 0,
        closeEncounters: closeEncounters.event_count || 0,
        dangerousProximities: closeEncounters.event_count || 0,
        speedData: results,
        trafficData: trafficSummary,
        proximityData: closeEncounters,
        frameByFrameData: {}
      });
      
      console.log(`  ✅ Analysis saved: Score ${drivingScores.overall_score || 0}/100\n`);
      successCount++;
      
    } catch (error) {
      console.error(`  ❌ Error processing ${videoFilename}:`, error.message, '\n');
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Backfill Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successfully imported: ${successCount} analyses`);
  console.log(`⏭️  Skipped: ${skipCount} analyses`);
  console.log(`❌ Errors: ${errorCount} analyses`);
  console.log('='.repeat(60));
  
  if (successCount > 0) {
    console.log('\n🎉 Backfill completed! Check your Supabase dashboard.');
  }
}

// Run the backfill
backfillAnalyses().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
