#!/bin/sh
# Writes config.js from environment variables when the container starts.
#
# The official nginx image runs every script in /docker-entrypoint.d/ before
# starting nginx; the "40-" prefix makes this one run after the built-in ones.
#
# The Firebase web config isn't secret (every visitor's browser sees it), but
# it differs per environment, so it's set at start-up, not built into the image.
set -eu

OUT_DIR=/tmp/runtime-config
mkdir -p "$OUT_DIR"

# Fail with a clear message instead of serving a broken app.
for var in FIREBASE_API_KEY FIREBASE_AUTH_DOMAIN FIREBASE_PROJECT_ID FIREBASE_APP_ID; do
  eval "value=\${$var:-}"
  if [ -z "$value" ]; then
    echo "ERROR: environment variable $var is required" >&2
    exit 1
  fi
done

cat > "$OUT_DIR/config.js" <<EOF
// Generated when the container started. Do not edit.
window.APP_CONFIG = {
  firebase: {
    apiKey: "$FIREBASE_API_KEY",
    authDomain: "$FIREBASE_AUTH_DOMAIN",
    projectId: "$FIREBASE_PROJECT_ID",
    appId: "$FIREBASE_APP_ID"
  }
};
EOF

echo "Generated $OUT_DIR/config.js for Firebase project $FIREBASE_PROJECT_ID"