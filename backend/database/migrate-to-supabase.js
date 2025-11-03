// Migration script to move existing JSON data to Supabase
const fs = require('fs');
const path = require('path');
const { db } = require('./supabase');

async function migrateUsers() {
  console.log('📊 Starting migration from JSON to Supabase...\n');

  // Check if Supabase is configured
  if (!db.isConfigured()) {
    console.error('❌ Supabase is not configured. Please set environment variables.');
    process.exit(1);
  }

  try {
    // Read existing users.json
    const usersPath = path.join(__dirname, '..', 'data', 'users.json');
    
    if (!fs.existsSync(usersPath)) {
      console.log('⚠️  No users.json file found. Nothing to migrate.');
      return;
    }

    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    
    console.log(`Found ${usersData.users.length} users to migrate\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of usersData.users) {
      try {
        // Check if user already exists
        const existing = await db.users.findByEmail(user.email);
        
        if (existing) {
          console.log(`⏭️  Skipping ${user.email} - already exists`);
          skippedCount++;
          continue;
        }

        // Create user in Supabase
        await db.users.create({
          email: user.email,
          password: user.password, // Will be hashed by db.users.create
          firstName: user.firstName,
          lastName: user.lastName,
          company: user.company,
          accountType: user.accountType,
          businessType: user.businessType,
          carNumber: user.carNumber
        });

        console.log(`✅ Migrated: ${user.email}`);
        migratedCount++;

        // Note: Analyses will need to be migrated separately after videos are uploaded
        // as they reference video_id
        
      } catch (error) {
        console.error(`❌ Error migrating ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${migratedCount}`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

    if (migratedCount > 0) {
      console.log('\n📝 Next Steps:');
      console.log('1. Videos need to be uploaded to Supabase Storage');
      console.log('2. Run video migration script after setting up storage');
      console.log('3. Update frontend to use new authentication');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateUsers()
    .then(() => {
      console.log('\n✨ Migration completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

module.exports = { migrateUsers };
