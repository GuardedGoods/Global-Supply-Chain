# Stage 1: Install dependencies and build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace config
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install all dependencies
RUN npm install

# Copy source code
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

# Build client
RUN npm run build -w client

# Build server
RUN npm run build -w server

# Stage 2: Production runtime
FROM node:20-alpine

# Install su-exec for privilege dropping in the entrypoint
RUN apk add --no-cache su-exec

WORKDIR /app

# Copy workspace config
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install production dependencies only
RUN npm install --omit=dev -w server

# Copy shared types
COPY shared/ ./shared/

# Copy built server
COPY --from=builder /app/server/dist ./server/dist

# Copy built client
COPY --from=builder /app/client/dist ./client/dist

# Create data directory for SQLite and set up non-root user
RUN mkdir -p /app/data
RUN addgroup -S app && adduser -S app -G app
RUN chown -R app:app /app

# Entrypoint fixes volume permissions at runtime, then drops to 'app' user.
# This is needed because named Docker volumes start as root-owned and would
# otherwise be unwritable by the app user.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=9049

EXPOSE 9049

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server/dist/server/src/index.js"]
