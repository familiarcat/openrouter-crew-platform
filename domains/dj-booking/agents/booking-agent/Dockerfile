FROM node:20-alpine AS builder

WORKDIR /app

COPY agents/booking-agent/package*.json agents/booking-agent/tsconfig.json ./
RUN npm install

COPY agents/booking-agent/src/ ./src/
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache curl

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

USER nodejs

EXPOSE 3001


CMD ["node", "dist/index.js"]
