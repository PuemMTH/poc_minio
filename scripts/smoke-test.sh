#!/bin/bash
set -e

echo "=== Smoke Test ==="

BASE_URL="${1:-http://localhost}"

# Health check
echo "1. Health check..."
HEALTH=$(curl -sf "$BASE_URL/api/health")
echo "   $HEALTH"

# Upload a test file
echo "2. Uploading test file..."
echo "Hello MinIO POC" > /tmp/test-upload.txt
UPLOAD=$(curl -sf -X POST "$BASE_URL/api/files" -F "file=@/tmp/test-upload.txt;type=text/plain")
FILE_ID=$(echo "$UPLOAD" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "   Uploaded file ID: $FILE_ID"

# List files
echo "3. Listing files..."
LIST=$(curl -sf "$BASE_URL/api/files")
TOTAL=$(echo "$LIST" | python3 -c "import sys,json; print(json.load(sys.stdin)['total'])")
echo "   Total files: $TOTAL"

# Download file through backend
echo "4. Downloading file..."
curl -sf "$BASE_URL/api/files/$FILE_ID/download" -o /tmp/test-download.txt
DOWNLOADED=$(cat /tmp/test-download.txt)
echo "   Downloaded content: $DOWNLOADED"

# Delete
echo "5. Deleting test file..."
DEL=$(curl -sf -X DELETE "$BASE_URL/api/files/$FILE_ID")
echo "   $DEL"

# Clean up
rm -f /tmp/test-upload.txt
rm -f /tmp/test-download.txt

echo ""
echo "=== All smoke tests passed ==="
