# Recipe for the frontend image: nginx with the site files built in.
# The unprivileged variant runs as a normal user, on port 8080.
FROM nginxinc/nginx-unprivileged:1.29-alpine

# Default API address: the "api" service in docker compose.
# Overridden per environment (Kubernetes sets its own).
ENV API_UPSTREAM=http://api:8080

# The nginx config template, filled in when the container starts.
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template

# Start-up script that writes config.js from environment variables.
COPY --chmod=755 docker/40-generate-config.sh /docker-entrypoint.d/40-generate-config.sh

# The website itself. config.js is left out (see .dockerignore).
COPY public/ /usr/share/nginx/html/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1