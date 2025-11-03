# DriveGuard AI - Supabase Setup Guide

## 📋 Quick Setup Steps

### 1. Create Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up with your GitHub account
3. Create a new project named "driveguard-ai"
4. Wait ~2 minutes for project to be ready

### 2. Run Database Schema
1. Open your Supabase project dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **"New query"**
4. Copy the contents of `backend/database/schema.sql`
5. Paste and click **"Run"**
6. Wait for success message ✅

### 3. Setup Storage Bucket
1. Go to **Storage** in Supabase dashboard
2. Click **"Create a new bucket"**
3. Name it **"videos"**
4. Set it to **Public** (so videos can be streamed)
5. Click **"Create bucket"**

### 4. Get API Credentials
1. Go to **Settings** > **API**
2. Copy these values:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGc...
   service_role key: eyJhbGc... (⚠️ Keep this secret!)
   ```

### 5. Configure Backend
1. Open `backend/.env` file
2. Add your credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_KEY=your-service-key-here
   PORT=3001
   ```

### 6. Start Backend
```bash
cd backend
node server-supabase.js
```

### 7. Migrate Existing Data (Optional)
If you have existing users in `data/users.json`:
```bash
cd backend
node database/migrate-to-supabase.js
```

## 🎯 What You Get

### Database Tables
- ✅ **users** - User profiles and authentication
- ✅ **organizations** - Company/fleet data
- ✅ **videos** - Video metadata and storage links
- ✅ **video_analyses** - All analysis results
- ✅ **drivers** - Driver information (fleet operators)
- ✅ **vehicles** - Vehicle information (fleet operators)

### Features
- ✅ **Secure Authentication** - Bcrypt password hashing
- ✅ **Video Storage** - Supabase Storage with streaming
- ✅ **Fast Queries** - Indexed database for quick access
- ✅ **Auto Backups** - Supabase handles backups
- ✅ **Scalable** - Handles millions of records
- ✅ **Row Level Security** - Users can only access their own data

### Storage
- ✅ **500MB Database** (free tier)
- ✅ **1GB File Storage** (free tier)
- ✅ **Video Streaming** - Direct playback from storage
- ✅ **Automatic CDN** - Fast global delivery

## 📊 Database Schema Overview

```
users
├── id (UUID)
├── email (unique)
├── password_hash
├── first_name, last_name
├── company, car_number
├── account_type (individual/enterprise)
└── created_at, updated_at

videos
├── id (UUID)
├── user_id → users(id)
├── filename
├── storage_url (Supabase Storage URL)
├── upload_status
└── created_at

video_analyses
├── id (UUID)
├── video_id → videos(id)
├── user_id → users(id)
├── overall_score, speed_score, traffic_score
├── speed_data (JSONB)
├── traffic_data (JSONB)
├── proximity_data (JSONB)
└── created_at
```

## 🔒 Security Features

1. **Password Hashing** - Bcrypt with salt rounds
2. **Row Level Security** - Users can only access their own data
3. **Service Role** - Backend uses privileged key for admin operations
4. **API Keys** - Separate keys for frontend (anon) and backend (service)

## 🚀 API Endpoints

All endpoints work with both Supabase and JSON fallback:

- `POST /api/register` - Create new user
- `POST /api/login` - Authenticate user
- `GET /api/user-analyses/:email` - Get user's analysis history
- `POST /api/save-analysis` - Save new analysis
- `POST /api/upload-video` - Upload and analyze video
- `GET /api/health` - Check server and DB status

## 📈 Upgrading

### When you need more (all free tier limits):
- Database: 500MB → **8GB** ($25/month)
- Storage: 1GB → **100GB** ($25/month)
- API calls: 50,000/month → **Unlimited**

### Or stick with free tier:
- Perfect for **500-1000 users**
- **100-200 video analyses**
- **Development and testing**

## 🛠️ Troubleshooting

### "Supabase not configured"
- Check `.env` file has correct values
- Restart server after updating `.env`

### "Failed to connect"
- Verify project URL is correct (includes https://)
- Check API keys are copied completely

### "Permission denied"
- Make sure you're using **service_role** key in backend
- Check RLS policies in Supabase dashboard

### Migration fails
- Ensure schema.sql ran successfully first
- Check for duplicate emails in your JSON data

## 📝 Next Steps

1. ✅ Set up Supabase project
2. ✅ Run database schema
3. ✅ Create storage bucket
4. ✅ Add credentials to .env
5. ✅ Test with `node server-supabase.js`
6. ✅ Migrate existing data (optional)
7. 🎯 Update frontend to use new API

## 💡 Tips

- **Free tier is generous** - Start there and upgrade later
- **Backups are automatic** - No need to worry
- **Use service_role key only in backend** - Never expose it in frontend
- **Videos stay on disk initially** - Move to Supabase Storage later for better scalability
