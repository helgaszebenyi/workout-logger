# Recipe for the API image.
#
# Two stages: the first installs the dependencies, the second copies only
# what's needed to run. The final image has no tests, no dev tools and no
# npm cache, so it's smaller and has less that could be attacked.

# ---- Stage 1: install production dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app
# Copy only the package files first. Docker caches each step, so this slow
# npm step is reused until the dependencies actually change, not on every
# code edit.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Stage 2: the image that actually runs ----
FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=8080
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Run as the unprivileged "node" user that comes with the image, not as root.
USER node

EXPOSE 8080

# Docker checks this every 30 seconds and marks the container healthy or unhealthy.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

# Start node directly (not through npm), so the SIGTERM that Docker and
# Kubernetes send on shutdown reaches the app.
CMD ["node", "src/server.js"]