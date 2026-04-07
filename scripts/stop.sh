#!/bin/bash
set -e

echo "=== Stopping POC MinIO Stack ==="
docker compose down
echo "Stack stopped."
