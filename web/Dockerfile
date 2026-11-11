# Recipe for the frontend image, in two stages:
#   1. "build": Node installs the packages and builds the React app into dist/.
#   2. The final image: nginx serving dist/. No Node, no node_modules and no
#      source code end up in it, so it stays small.

# ---- Stage 1: build the React app ----
FROM node:22-alpine AS build
WORKDIR /app
# Package files first, so this slow step is cached until dependencies change.
COPY package.json package-lock.json ./
RUN npm ci
# Then the source code, and build.
COPY . .
RUN npm run build

# ---- Stage 2: serve the built app with nginx ----
# The unprivileged variant runs as a normal user, on port 8080.
FROM nginxinc/nginx-unprivileged:1.31-alpine

# Default API address: the "api" service in docker compose.
# Overridden per environment (Kubernetes sets its own).
ENV API_UPSTREAM=http://api:8080

# The nginx config template, filled in when the container starts.
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template

# Start-up script that writes config.js from environment variables.
COPY --chmod=755 docker/40-generate-config.sh /docker-entrypoint.d/40-generate-config.sh

# Only the finished site from stage 1.
COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1