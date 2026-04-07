#!/bin/bash
set -e

echo "=== Starting POC MinIO Stack ==="

# Copy env if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

# Build and start
docker compose up -d --build

echo ""
echo "=== Stack is starting ==="
echo "Frontend:       http://localhost"
echo "Backend API:    http://localhost/api/health"
echo "Backend Direct: http://localhost:8000/docs"
echo "MinIO Console:  http://localhost:9001  (minioadmin/minioadmin)"
echo "PostgreSQL:     localhost:5432"
echo ""
echo "Run 'docker compose logs -f' to see logs"
