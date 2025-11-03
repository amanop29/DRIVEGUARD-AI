/**
 * Upload existing videos from local storage to Supabase Storage
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { db } = require('./database/supabase');

async function uploadVideosToStorage() {
  console.log('📤 Starting upload of videos to Supabase Storage...\n');

  if (!db.isConfigured()) {
    console.error('❌ Supabase not configured! Check your .env file.');
    process.exit(1);
  }

  const videosDir = path.join(__dirname, 'videos');
  const files = fs.readdirSync(videosDir).filter(f => f.endsWith('.mp4'));

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const filename of files) {
    const filePath = path.join(videosDir, filename);
    
    try {
      console.log(`📹 Processing: ${filename}...`);
      
      // Read file
      const fileBuffer = fs.readFileSync(filePath);
      const stats = fs.statSync(filePath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`   Size: ${fileSizeMB} MB`);
      
      // Upload to Supabase Storage
      const uploadResult = await db.storage.uploadVideo(
        fileBuffer,
        'system', // Use 'system' as the folder for existing videos
        filename
      );
      
      console.log(`   ✅ Uploaded to: ${uploadResult.path}`);
      console.log(`   🔗 Public URL: ${uploadResult.url}`);
      
      // Update video record in database if it exists
      try {
        const video = await db.videos.findByFilename(filename);
        if (video) {
          await db.videos.updateStorageInfo(video.id, {
            storageUrl: uploadResult.url,
            storagePath: uploadResult.path
          });
          console.log(`   ✅ Updated video record in database\n`);
        } else {
          console.log(`   ℹ️  No database record found (will be created on next analysis)\n`);
        }
      } catch (dbError) {
        console.log(`   ⚠️  Could not update database record: ${dbError.message}\n`);
      }
      
      successCount++;
      
    } catch (error) {
      if (error.message && error.message.includes('duplicate')) {
        console.log(`   ⏭️  Already exists in storage, skipping...\n`);
        skipCount++;
      } else {
        console.error(`   ❌ Error: ${error.message}\n`);
        errorCount++;
      }
    }
  }

  console.log('='.repeat(60));
  console.log('📊 Upload Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successfully uploaded: ${successCount} videos`);
  console.log(`⏭️  Skipped (already exist): ${skipCount} videos`);
  console.log(`❌ Errors: ${errorCount} videos`);
  console.log('='.repeat(60));
  
  if (successCount > 0) {
    console.log('\n🎉 Upload completed! Videos are now in Supabase Storage.');
    console.log('Check your Supabase dashboard under Storage > videos bucket');
  }
}

// Run the upload
uploadVideosToStorage().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
