# ── deps ────────────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── build ───────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# predev runs migrations; skip it during image build
RUN npm run build

# ── runtime ─────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Docker sets HOSTNAME to the container ID; Next would bind to just one network's IP.
ENV HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Next standalone server + static assets
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# migration runner + SQL + its deps
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

USER nextjs
EXPOSE 3000
# apply migrations, then start
CMD ["sh", "-c", "node --import tsx scripts/migrate.ts && node server.js"]
