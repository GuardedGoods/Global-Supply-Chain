#!/bin/sh
set -e

# Ensure the data directory exists and is writable.
# Named Docker volumes start with root:root ownership; if we're running as
# root here (entrypoint runs as root by default before su-exec drops privs),
# fix permissions so the app user can write the SQLite database.
if [ -d /app/data ]; then
  chown -R app:app /app/data 2>/dev/null || true
  chmod -R u+rwX /app/data 2>/dev/null || true
fi

# Drop privileges to the unprivileged 'app' user and exec the server.
# If su-exec is unavailable (unlikely on Alpine), fall back to running as root.
if command -v su-exec >/dev/null 2>&1; then
  exec su-exec app "$@"
else
  exec "$@"
fi
