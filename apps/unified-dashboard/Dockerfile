FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 1. Prune the workspace (isolates only what is needed for this app)
FROM base AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=@openrouter-crew/unified-dashboard --docker

# 2. Install dependencies (using the pruned json)
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy only package.json files from the pruner stage
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 3. Build the application
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code from the pruner stage
COPY --from=pruner /app/out/full/ .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the project
RUN pnpm --filter @openrouter-crew/unified-dashboard build

# 4. Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build from the correct location
COPY --from=builder --chown=nextjs:nodejs /app/apps/unified-dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/unified-dashboard/.next/static ./apps/unified-dashboard/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/unified-dashboard/public ./apps/unified-dashboard/public

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/unified-dashboard/server.js"]