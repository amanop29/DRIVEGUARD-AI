#!/bin/bash

echo "🚀 DriveGuard AI - Quick Backend Deployment Setup"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "backend/server.js" ]; then
    echo -e "${YELLOW}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Choose your deployment platform:${NC}"
echo "1) Railway.app (Recommended - Free tier available)"
echo "2) Render.com (Free tier with limitations)"
echo "3) Docker (Local or custom hosting)"
echo "4) Skip (I'll deploy manually)"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}🚂 Railway.app Deployment${NC}"
        echo "======================================"
        echo ""
        echo "Steps to deploy on Railway:"
        echo ""
        echo "1. Visit: https://railway.app"
        echo "2. Sign in with your GitHub account"
        echo "3. Click 'New Project'"
        echo "4. Select 'Deploy from GitHub repo'"
        echo "5. Choose: amanop29/DRIVEGUARD-AI"
        echo "6. Railway will auto-detect the Dockerfile"
        echo "7. Set these environment variables:"
        echo "   - NODE_ENV=production"
        echo "   - PORT=3001"
        echo "   - FRONTEND_URL=https://amanop29.github.io/DRIVEGUARD-AI"
        echo ""
        echo "8. Click 'Deploy'"
        echo "9. Copy your deployment URL"
        echo ""
        echo -e "${YELLOW}💡 Tip: Railway offers \$5 free credit per month${NC}"
        ;;
    2)
        echo ""
        echo -e "${GREEN}🎨 Render.com Deployment${NC}"
        echo "======================================"
        echo ""
        echo "Steps to deploy on Render:"
        echo ""
        echo "1. Visit: https://render.com"
        echo "2. Sign in with your GitHub account"
        echo "3. Click 'New +' → 'Web Service'"
        echo "4. Connect your repo: amanop29/DRIVEGUARD-AI"
        echo "5. Configure:"
        echo "   - Name: driveguard-ai-backend"
        echo "   - Environment: Docker"
        echo "   - Root Directory: backend"
        echo "6. Set environment variables:"
        echo "   - NODE_ENV=production"
        echo "   - PORT=3001"
        echo "   - FRONTEND_URL=https://amanop29.github.io/DRIVEGUARD-AI"
        echo ""
        echo "7. Click 'Create Web Service'"
        echo "8. Copy your service URL"
        echo ""
        echo -e "${YELLOW}💡 Tip: Free tier spins down after 15 min of inactivity${NC}"
        ;;
    3)
        echo ""
        echo -e "${GREEN}🐳 Docker Deployment${NC}"
        echo "======================================"
        echo ""
        
        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            echo -e "${YELLOW}❌ Docker is not installed. Please install Docker first.${NC}"
            echo "Visit: https://docs.docker.com/get-docker/"
            exit 1
        fi
        
        echo "Building Docker image..."
        cd backend
        docker build -t driveguard-ai-backend .
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Docker image built successfully!${NC}"
            echo ""
            echo "To run the container:"
            echo ""
            echo "docker run -p 3001:3001 \\"
            echo "  -e NODE_ENV=production \\"
            echo "  -e FRONTEND_URL=https://amanop29.github.io/DRIVEGUARD-AI \\"
            echo "  -v \$(pwd)/videos:/app/backend/videos \\"
            echo "  -v \$(pwd)/outputs:/app/backend/outputs \\"
            echo "  -v \$(pwd)/data:/app/backend/data \\"
            echo "  driveguard-ai-backend"
            echo ""
            echo "Backend will be available at: http://localhost:3001"
        else
            echo -e "${YELLOW}❌ Docker build failed. Check the errors above.${NC}"
        fi
        cd ..
        ;;
    4)
        echo ""
        echo -e "${BLUE}📚 Manual Deployment${NC}"
        echo "======================================"
        echo ""
        echo "Check the detailed deployment guide:"
        echo "docs/BACKEND_DEPLOYMENT.md"
        ;;
    *)
        echo -e "${YELLOW}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}=================================================="
echo "✅ Setup Instructions Displayed!"
echo "==================================================${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Deploy backend using the instructions above"
echo "2. Get your backend URL"
echo "3. Update frontend API configuration"
echo "4. Test the full application"
echo ""
echo "📖 For more details, see: docs/BACKEND_DEPLOYMENT.md"
echo ""
