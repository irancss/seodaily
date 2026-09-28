# syntax=docker/dockerfile:1

# Base image; override with a mirror where Docker Hub is unreachable, e.g.
#   docker compose build --build-arg NODE_IMAGE=docker.arvancloud.ir/node:22-alpine
# (or set NODE_IMAGE in .env).
ARG NODE_IMAGE=node:22-alpine

# ---- dependencies ----
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- build ----
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime ----
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/app/uploads

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

# Traced standalone server + static assets.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Migrations and seed run on start; their packages are not traced by Next.
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=builder /app/node_modules/postgres ./node_modules/postgres
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads
VOLUME ["/app/uploads"]

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

# Last, so a new commit only changes this metadata layer: /api/health reports it.
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

ENTRYPOINT ["entrypoint.sh"]
