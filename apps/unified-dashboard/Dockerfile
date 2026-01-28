# Multi-stage Dockerfile for production deployment
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/unified-dashboard/package.json ./apps/unified-dashboard/
COPY domains/shared/crew-coordination/package.json ./domains/shared/crew-coordination/
COPY domains/shared/cost-tracking/package.json ./domains/shared/cost-tracking/
COPY domains/shared/schemas/package.json ./domains/shared/schemas/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/unified-dashboard/node_modules ./apps/unified-dashboard/node_modules

# Copy all source code
COPY . .

# Build packages first
RUN pnpm --filter @openrouter-crew/shared-schemas build
RUN pnpm --filter @openrouter-crew/shared-crew-coordination build
RUN pnpm --filter @openrouter-crew/shared-cost-tracking build

# Build dashboard
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN pnpm --filter @openrouter-crew/unified-dashboard build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/unified-dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/unified-dashboard/.next/static ./apps/unified-dashboard/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/unified-dashboard/public ./apps/unified-dashboard/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/unified-dashboard/server.js"]
