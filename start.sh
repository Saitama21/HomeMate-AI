#!/bin/sh
set -eu

PORT_VALUE="${PORT:-8000}"

case "$PORT_VALUE" in
  ''|*[!0-9]*)
    echo "ERROR: PORT must be an integer, got: '$PORT_VALUE'" >&2
    exit 64
    ;;
esac

echo "Starting HomeMate AI on 0.0.0.0:${PORT_VALUE}"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT_VALUE}"
