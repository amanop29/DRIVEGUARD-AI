#!/bin/bash

# DriveGuardAI Quick Start Script
# This script starts both backend and frontend servers
# Updated for new frontend/backend structure

# Get the directory where the script is located (project root)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "============================================================"
echo "🚀 Starting DriveGuard AI System (Reorganized Structure)"
echo "============================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python3 first."
    exit 1
fi

# Check if backend dependencies are installed
if [ ! -d "$SCRIPT_DIR/backend/node_modules" ]; then
    echo "📦 Installing Backend dependencies..."
    cd "$SCRIPT_DIR/backend" && npm install
    echo "✅ Backend dependencies installed"
    echo ""
fi

# Check if frontend dependencies are installed
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo "📦 Installing Frontend dependencies..."
    cd "$SCRIPT_DIR/frontend" && npm install
    echo "✅ Frontend dependencies installed"
    echo ""
fi

# Kill any existing processes on ports 3001 and 5173
echo "🧹 Cleaning up any existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 1

# Start backend server in background
echo "🔧 Starting Backend Server (Port 3001)..."
cd "$SCRIPT_DIR/backend" && node server.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend Server started (PID: $BACKEND_PID)"
echo ""

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 3

# Check if backend is running
MAX_RETRIES=5
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ Backend health check passed"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "⏳ Retrying health check ($RETRY_COUNT/$MAX_RETRIES)..."
            sleep 2
        else
            echo "❌ Backend failed to start. Check backend.log for errors."
            kill $BACKEND_PID 2>/dev/null
            exit 1
        fi
    fi
done

echo ""

# Start frontend dev server
echo "🎨 Starting Frontend Dev Server (Port 5173)..."
echo ""
echo "============================================================"
echo "✅ System Ready!"
echo "============================================================"
echo "Backend API: http://localhost:3001"
echo "Frontend UI: http://localhost:5173"
echo ""
echo "📝 Backend logs: tail -f backend/backend.log"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "============================================================"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    echo "✅ Servers stopped"
    exit 0
}

trap cleanup EXIT INT TERM

# Start frontend (this will block until Ctrl+C)
cd "$SCRIPT_DIR/frontend" && npm run dev
