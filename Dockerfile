# ==============================================================================
# OpenRouter Crew Platform - Production Docker Image
# Multi-stage build with security hardening
# ==============================================================================

# Stage 1: Builder - compile everything with latest secure base
FROM node:20.12-alpine3.19 AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Update base packages to patch vulnerabilities
RUN apk update && apk upgrade && \
    apk add --no-cache curl tini python3 make g++

# Enable pnpm
RUN corepack enable

WORKDIR /app

# Copy entire monorepo
COPY . .

# Install dependencies (with BuildKit cache)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Build all packages
RUN pnpm -r build

# Stage 2: Production runtime - minimal and secure
FROM node:20.12-alpine3.19

ENV NODE_ENV=production
ENV PORT=3000
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Update base image and install only essential runtime packages
RUN apk update && apk upgrade && \
    apk add --no-cache curl tini dumb-init && \
    apk del apk-tools && \
    rm -rf /var/cache/apk/*

# Enable pnpm
RUN corepack enable

WORKDIR /app

# Create non-root user (security best practice)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app && \
    chown -R nodejs:nodejs /app

# Copy only production artifacts from builder
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-lock.yaml ./
COPY --from=builder --chown=nodejs:nodejs /app/domains/shared/agent-orchestration/dist ./dist

# Install production dependencies only
RUN --mount=type=cache,id=pnpm-prod,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod && \
    pnpm store prune

# Remove unnecessary files to reduce attack surface
RUN find /usr/local -name "*.json" -o -name "*.md" | xargs rm -f 2>/dev/null || true

# Switch to non-root user
USER nodejs

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Expose port
EXPOSE 3000

# Use dumb-init as PID 1 for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start MCP server
CMD ["node", "--enable-source-maps", "dist/mcp/server.js"]

# Metadata
LABEL maintainer="OpenRouter Crew Platform Team"
LABEL description="Multi-agent orchestration system with Model Context Protocol (MCP)"
LABEL version="1.0.0"
LABEL security="non-root-user,minimal-surface,security-patched"