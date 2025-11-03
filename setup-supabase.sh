#!/bin/bash

# DriveGuard AI - Supabase Quick Setup Script
# This script helps you set up Supabase integration

echo "🚀 DriveGuard AI - Supabase Setup"
echo "=================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Supabase Configuration
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Server Configuration
PORT=3001
NODE_ENV=development
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Go to https://supabase.com and create an account"
echo "2. Create a new project called 'driveguard-ai'"
echo "3. Wait for project initialization (~2 minutes)"
echo ""
echo "4. Get your credentials from Settings > API:"
echo "   - Project URL (SUPABASE_URL)"
echo "   - anon public key (SUPABASE_ANON_KEY)"
echo "   - service_role key (SUPABASE_SERVICE_KEY)"
echo ""
echo "5. Edit backend/.env and add your credentials"
echo ""
echo "6. Run the database schema:"
echo "   - Open Supabase SQL Editor"
echo "   - Copy contents of backend/database/schema.sql"
echo "   - Paste and run"
echo ""
echo "7. Create storage bucket:"
echo "   - Go to Storage in Supabase"
echo "   - Create new bucket named 'videos'"
echo "   - Make it public"
echo ""
echo "8. Start the server:"
echo "   cd backend && node server-supabase.js"
echo ""
echo "9. (Optional) Migrate existing data:"
echo "   node database/migrate-to-supabase.js"
echo ""
echo "📖 For detailed instructions, see: backend/database/SUPABASE_SETUP.md"
echo ""
