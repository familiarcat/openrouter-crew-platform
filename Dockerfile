# ==============================================================================
# OpenRouter Crew Platform - Remote Build Artifact
# ==============================================================================
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Builder Stage
FROM base AS builder
WORKDIR /app

# Copy entire monorepo context
COPY . .

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build all packages
RUN pnpm -r build

# Verification (Optional: List built artifacts)
RUN find packages/*/dist -maxdepth 1