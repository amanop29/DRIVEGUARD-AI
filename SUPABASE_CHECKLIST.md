# 🎯 Supabase Setup Checklist

Use this checklist to set up Supabase for DriveGuard AI.

## ☐ Step 1: Create Supabase Account (2 minutes)

- [ ] Go to https://supabase.com
- [ ] Click "Start your project"
- [ ] Sign up with GitHub account
- [ ] Verify email (if required)

## ☐ Step 2: Create New Project (3 minutes)

- [ ] Click "New Project"
- [ ] Fill in details:
  - [ ] Name: `driveguard-ai`
  - [ ] Database Password: (save this somewhere!)
  - [ ] Region: Choose closest to you
  - [ ] Pricing Plan: Free
- [ ] Click "Create new project"
- [ ] Wait ~2 minutes for initialization

## ☐ Step 3: Run Database Schema (2 minutes)

- [ ] Project is ready (green indicator)
- [ ] Click "SQL Editor" in left sidebar
- [ ] Click "New query"
- [ ] Open `backend/database/schema.sql` on your computer
- [ ] Copy entire file contents
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run" (or Cmd/Ctrl + Enter)
- [ ] Wait for "Success" message
- [ ] Verify: Go to "Table Editor" - you should see 6 tables

## ☐ Step 4: Create Storage Bucket (1 minute)

- [ ] Click "Storage" in left sidebar
- [ ] Click "Create a new bucket"
- [ ] Enter bucket name: `videos`
- [ ] Toggle "Public bucket" to ON
- [ ] Click "Create bucket"
- [ ] Verify bucket appears in list

## ☐ Step 5: Get API Credentials (1 minute)

- [ ] Click "Settings" (gear icon) in left sidebar
- [ ] Click "API" section
- [ ] Find "Project URL"
  - [ ] Copy it (looks like: https://xxxxx.supabase.co)
  - [ ] Save it somewhere
- [ ] Find "Project API keys"
  - [ ] Copy `anon` `public` key
  - [ ] Copy `service_role` key (⚠️ keep this secret!)

## ☐ Step 6: Configure Backend (2 minutes)

- [ ] Open `backend/.env` file in VS Code
- [ ] Add your credentials:
  ```env
  SUPABASE_URL=https://xxxxx.supabase.co
  SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
  SUPABASE_SERVICE_KEY=eyJhbGc...your-service-key...
  PORT=3001
  ```
- [ ] Save the file
- [ ] Verify `.env` is in `.gitignore` (it is!)

## ☐ Step 7: Test Connection (1 minute)

- [ ] Open terminal in VS Code
- [ ] Run test:
  ```bash
  cd backend
  npm run test:supabase
  ```
- [ ] All tests should pass ✅
- [ ] If errors, check troubleshooting section below

## ☐ Step 8: Start Server (30 seconds)

- [ ] In terminal, run:
  ```bash
  npm run start:supabase
  ```
- [ ] Should see:
  ```
  🚀 DriveGuard AI Backend Server
  💾 Database: Supabase ✅
  📡 Server running on http://localhost:3001
  ```

## ☐ Step 9: Test API (1 minute)

- [ ] Open browser or Postman
- [ ] Test health endpoint:
  ```
  GET http://localhost:3001/api/health
  ```
- [ ] Should return:
  ```json
  {
    "status": "ok",
    "database": "Supabase",
    "supabase": true
  }
  ```

## ☐ Step 10: Migrate Existing Data (Optional)

**Only if you have users in `data/users.json`:**

- [ ] Run migration:
  ```bash
  npm run migrate
  ```
- [ ] Check output for success messages
- [ ] Verify users in Supabase Table Editor

---

## 🎉 Done!

You've successfully set up Supabase! Your DriveGuard AI backend is now using:

✅ PostgreSQL database (500MB free)
✅ Video storage (1GB free)
✅ Secure authentication
✅ Auto backups
✅ Scalable architecture

---

## 🛠️ Troubleshooting

### Test Failed: "Failed to connect"
**Fix:**
1. Check `SUPABASE_URL` includes `https://`
2. Verify keys are complete (they're very long!)
3. Make sure project is active in Supabase dashboard

### Test Failed: "Permission denied"
**Fix:**
1. Verify you're using `SUPABASE_SERVICE_KEY` (not anon key)
2. Check schema.sql ran successfully
3. Go to Supabase > SQL Editor and run schema again

### Test Failed: "relation 'users' does not exist"
**Fix:**
1. You need to run the schema.sql file
2. Go to Supabase > SQL Editor
3. Copy-paste contents of `backend/database/schema.sql`
4. Click Run

### Server shows "Supabase not configured"
**Fix:**
1. Make sure `.env` file exists in `backend/` folder
2. Check all 3 variables are set correctly
3. Restart server after editing `.env`

### Videos bucket not found
**Fix:**
1. Go to Supabase > Storage
2. Create new bucket named "videos"
3. Make sure "Public bucket" is ON
4. Rerun test

---

## 📖 Quick Reference

### Useful Commands
```bash
# Test Supabase connection
npm run test:supabase

# Start server with Supabase
npm run start:supabase

# Development mode (auto-reload)
npm run dev:supabase

# Migrate existing data
npm run migrate

# Check server health
curl http://localhost:3001/api/health
```

### File Locations
- Schema: `backend/database/schema.sql`
- Database client: `backend/database/supabase.js`
- Server: `backend/server-supabase.js`
- Environment: `backend/.env`
- Documentation: `backend/database/SUPABASE_SETUP.md`

### Important URLs
- Supabase Dashboard: https://supabase.com/dashboard
- Your Project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
- Docs: https://supabase.com/docs
- Community: https://discord.supabase.com

---

## 🆘 Need Help?

1. **Check the logs** - Server shows detailed error messages
2. **Read error carefully** - Usually tells you exactly what's wrong
3. **Review documentation** - See `backend/database/SUPABASE_SETUP.md`
4. **Supabase Discord** - Very active community support

---

**Last updated:** 3 November 2025

**Version:** 1.0
