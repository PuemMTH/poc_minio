#!/bin/bash
set -e

echo "=== Running Database Migrations ==="
docker compose exec backend uv run alembic upgrade head
echo "Migrations complete."
