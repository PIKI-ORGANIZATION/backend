#!/bin/bash
# Run a specific seed file from prisma/ directory
# Usage: ./scripts/seed.sh [seedFileName]
# Example: ./scripts/seed.sh seedPageSetting
# Default: runs prisma/seed.ts

SEED_NAME="${1:-seed}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

exec "$SCRIPT_DIR/with-db-url.sh" bun "prisma/${SEED_NAME}.ts"
