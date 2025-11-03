// Test Supabase Connection and Setup
require('dotenv').config();
const { db, supabase } = require('./database/supabase');

async function testConnection() {
  console.log('🧪 Testing Supabase Connection...\n');

  // Check if configured
  if (!db.isConfigured()) {
    console.log('❌ Supabase is NOT configured');
    console.log('📝 Please set these environment variables in .env:');
    console.log('   - SUPABASE_URL');
    console.log('   - SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  console.log('✅ Supabase client configured');
  console.log(`📡 URL: ${process.env.SUPABASE_URL}\n`);

  try {
    // Test 1: Database connection
    console.log('Test 1: Database Connection');
    const { data, error } = await supabase.from('users').select('count');
    if (error) throw error;
    console.log('✅ Successfully connected to database\n');

    // Test 2: Create test user
    console.log('Test 2: Create Test User');
    const testEmail = `test_${Date.now()}@example.com`;
    
    const user = await db.users.create({
      email: testEmail,
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      accountType: 'individual'
    });
    
    console.log(`✅ Created user: ${user.email}`);
    console.log(`   User ID: ${user.id}\n`);

    // Test 3: Find user by email
    console.log('Test 3: Find User by Email');
    const foundUser = await db.users.findByEmail(testEmail);
    console.log(`✅ Found user: ${foundUser.first_name} ${foundUser.last_name}\n`);

    // Test 4: Verify password
    console.log('Test 4: Password Verification');
    const verifiedUser = await db.users.verifyPassword(testEmail, 'Test123!');
    if (verifiedUser) {
      console.log('✅ Password verification successful\n');
    } else {
      throw new Error('Password verification failed');
    }

    // Test 5: Storage bucket check
    console.log('Test 5: Storage Bucket');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) throw bucketError;
    
    const videosBucket = buckets.find(b => b.name === 'videos');
    if (videosBucket) {
      console.log(`✅ Videos bucket exists: ${videosBucket.name}`);
      console.log(`   Public: ${videosBucket.public}\n`);
    } else {
      console.log('⚠️  Videos bucket not found');
      console.log('   Create it in Supabase Dashboard > Storage\n');
    }

    // Test 6: Get all users count
    console.log('Test 6: User Count');
    const allUsers = await db.users.getAll();
    console.log(`✅ Total users in database: ${allUsers.length}\n`);

    console.log('='.repeat(60));
    console.log('🎉 All Tests Passed!');
    console.log('='.repeat(60));
    console.log('✅ Supabase is properly configured');
    console.log('✅ Database connection working');
    console.log('✅ User operations working');
    console.log('✅ Password hashing working');
    if (videosBucket) {
      console.log('✅ Storage bucket configured');
    }
    console.log('='.repeat(60));
    console.log('\n🚀 You can now start the server:');
    console.log('   npm run start:supabase\n');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    if (error.hint) {
      console.error(`   Hint: ${error.hint}`);
    }
    console.log('\n📖 Troubleshooting:');
    console.log('1. Check that you ran the schema.sql in Supabase SQL Editor');
    console.log('2. Verify SUPABASE_SERVICE_KEY (not anon key) is in .env');
    console.log('3. Make sure project is active in Supabase dashboard');
    process.exit(1);
  }
}

// Run tests
testConnection();
