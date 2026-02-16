FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 1. Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package.json files for workspace installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/unified-dashboard/package.json ./apps/unified-dashboard/package.json

# Copy shared packages package.json files
COPY domains/shared/crew-api-client/package.json ./domains/shared/crew-api-client/package.json
COPY domains/shared/cost-tracking/package.json ./domains/shared/cost-tracking/package.json
COPY domains/shared/crew-coordination/package.json ./domains/shared/crew-coordination/package.json
COPY domains/shared/schemas/package.json ./domains/shared/schemas/package.json
COPY domains/shared/ui-components/package.json ./domains/shared/ui-components/package.json
COPY domains/shared/openrouter-client/package.json ./domains/shared/openrouter-client/package.json
COPY domains/shared/n8n-integration/package.json ./domains/shared/n8n-integration/package.json
COPY domains/shared/workflows/package.json ./domains/shared/workflows/package.json

# Copy other workspaces to satisfy lockfile
COPY apps/cli/package.json ./apps/cli/package.json
COPY domains/vscode-extension/package.json ./domains/vscode-extension/package.json
COPY domains/alex-ai-universal/dashboard/package.json ./domains/alex-ai-universal/dashboard/package.json
COPY domains/product-factory/dashboard/package.json ./domains/product-factory/dashboard/package.json
COPY domains/product-factory/project-templates/dj-booking/dashboard/package.json ./domains/product-factory/project-templates/dj-booking/dashboard/package.json
COPY domains/product-factory/projects/test-event-venue/dashboard/package.json ./domains/product-factory/projects/test-event-venue/dashboard/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prefer-offline

# Build ONLY the dashboard and its dependencies
RUN pnpm --filter @openrouter-crew/unified-dashboard build

# 3. Production image, copy all the files and run next
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