# Error Debugging MCP Server - Production Docker Image
# Multi-stage build for optimized production image

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Production stage
FROM node:18-alpine AS production

# Install system dependencies for language tools
RUN apk add --no-cache \
    python3 \
    py3-pip \
    go \
    rust \
    cargo \
    git \
    curl \
    bash

# Install global language tools
RUN npm install -g \
    typescript \
    eslint \
    @typescript-eslint/parser \
    @typescript-eslint/eslint-plugin

# Install Python tools
RUN pip3 install pylint

# Install Go tools
RUN go install golang.org/x/tools/cmd/goimports@latest && \
    go install honnef.co/go/tools/cmd/staticcheck@latest

# Install Rust tools
RUN rustup component add clippy

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package*.json ./
COPY --from=builder --chown=appuser:nodejs /app/docs ./docs
COPY --from=builder --chown=appuser:nodejs /app/README.md ./

# Create necessary directories
RUN mkdir -p /app/logs /app/tmp && \
    chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    LOG_LEVEL=info \
    LOG_FILE=/app/logs/server.log

# Start the application
CMD ["node", "dist/index.js"]
