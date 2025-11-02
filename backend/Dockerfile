# Ultra-lightweight Dockerfile for DriveGuard AI Backend
# Optimized to be under 2GB (Railway free tier compatible)
FROM node:20-alpine

# Install Python 3 and only essential dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-numpy \
    gcc \
    g++ \
    musl-dev \
    python3-dev \
    linux-headers \
    ffmpeg \
    && ln -sf python3 /usr/bin/python

# Fix pip for modern Python
ENV PIP_BREAK_SYSTEM_PACKAGES=1

WORKDIR /app/backend

# Copy and install Node.js dependencies (with production flag)
COPY backend/package*.json ./
RUN npm ci --only=production --omit=dev && \
    npm cache clean --force && \
    rm -rf /tmp/*

# Copy and install ultra-minimal Python dependencies
COPY backend/config/requirements.minimal.txt ./config/
RUN pip3 install --no-cache-dir \
    --no-deps \
    opencv-python-headless==4.8.1.78 && \
    rm -rf /root/.cache/pip /tmp/* /var/cache/apk/*

# Copy only necessary application files
COPY backend/server.js ./
COPY backend/analysis ./analysis
COPY backend/config ./config
COPY backend/data ./data
COPY backend/utils ./utils

# Create necessary directories
RUN mkdir -p videos outputs/analysis outputs/logs data models

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["npm", "start"]
