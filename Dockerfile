# Multi-stage production Dockerfile for SPEK Enhanced Development Platform
# Optimized for GitHub Actions CI/CD deployment

# Stage 1: Build environment
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies with clean install
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY tests/ ./tests/
COPY docs/ ./docs/
COPY config/ ./config/

# Build the TypeScript application
RUN npm run build

# Run tests to ensure build quality
RUN npm run test:ci

# Stage 2: Production runtime
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S spek -u 1001

# Set working directory
WORKDIR /app

# Install production system dependencies
RUN apk add --no-cache \
    curl \
    tini \
    && rm -rf /var/cache/apk/*

# Copy built application from builder stage
COPY --from=builder --chown=spek:nodejs /app/dist ./dist
COPY --from=builder --chown=spek:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=spek:nodejs /app/package*.json ./

# Copy configuration files
COPY --chown=spek:nodejs config/ ./config/

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/tmp /app/data && \
    chown -R spek:nodejs /app

# Switch to non-root user
USER spek

# Expose application port
EXPOSE 8080

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Use tini as init system for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "dist/index.js"]

# Metadata labels
LABEL maintainer="SPEK Development Team" \
      version="1.0.0" \
      description="SPEK Enhanced Development Platform - Production Container" \
      org.opencontainers.image.source="https://github.com/spek-ai/spek-platform" \
      org.opencontainers.image.documentation="https://docs.spek.ai" \
      org.opencontainers.image.vendor="SPEK AI"