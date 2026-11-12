FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SESSION_SECRET=docker-build-placeholder
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV WISHLIST_DATA_PATH=/data/wishlist.json

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /data \
  && chown node:node /data

# The standalone server, completed by `postbuild` (scripts/prepare-standalone.mjs) with public/,
# .next/static/, drizzle/ (migrations applied when the database opens) and data/seed.json.
# `npm start` runs the same folder.
COPY --from=builder --chown=node:node /app/.next/standalone ./
# Hot backup (deploy/backup-whishlist.sh).
COPY --from=builder --chown=node:node /app/scripts/db-backup.mjs ./scripts/db-backup.mjs

# The image's `node` user (1000:1000) owns the data volume on the host (deploy/harden-data.sh), so the image
# runs as that user even where the platform cannot set one (Dokploy).
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD curl -fsS http://127.0.0.1:3000/ >/dev/null || exit 1

CMD ["node", "server.js"]
