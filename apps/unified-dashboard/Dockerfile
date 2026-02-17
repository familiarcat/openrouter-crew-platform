FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 1. Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/unified-dashboard/package.json ./apps/unified-dashboard/package.json
# Copy other workspace packages if needed for strict install, or use --ignore-scripts
RUN pnpm install --frozen-lockfile

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Build-time variables for Next.js
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN pnpm --filter unified-dashboard build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/unified-dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/unified-dashboard/.next/static ./apps/unified-dashboard/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/unified-dashboard/public ./apps/unified-dashboard/public

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "apps/unified-dashboard/server.js"]