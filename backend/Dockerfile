# Lightweight single-stage Dockerfile for DriveGuard AI Backend
FROM node:20-slim

# Install Python 3 and minimal dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    gcc \
    g++ \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Fix pip for Debian bookworm - create a virtual environment or use --break-system-packages
ENV PIP_BREAK_SYSTEM_PACKAGES=1

WORKDIR /app/backend

# Copy and install Node.js dependencies first (better caching)
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy and install minimal Python dependencies
COPY backend/config/requirements.minimal.txt ./config/
RUN pip3 install --no-cache-dir -r config/requirements.minimal.txt && \
    rm -rf /root/.cache/pip

# Copy application files
COPY backend/ .

# Create necessary directories
RUN mkdir -p videos outputs/analysis outputs/logs data

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["npm", "start"]
