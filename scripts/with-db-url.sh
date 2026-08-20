#!/bin/bash
# Compose DATABASE_URL from POSTGRES_* vars, write to prisma/.env for Prisma CLI
# Usage: ./scripts/with-db-url.sh bunx prisma migrate dev

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

# Compose URL using bun (handles special chars in password safely)
DB_URL=$(bun -e "
  const fs = require('fs');
  const lines = fs.readFileSync('$ENV_FILE', 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const m = line.match(/^([A-Z_]+)=[\"]?([^\"]*)[\"]?$/);
    if (m) env[m[1]] = m[2];
  }
  const u = env.POSTGRES_USER;
  const p = encodeURIComponent(env.POSTGRES_PASSWORD || '');
  const h = env.POSTGRES_HOST || 'localhost';
  const port = env.POSTGRES_PORT || '5432';
  const db = env.POSTGRES_DB;
  if (u && db) console.log('postgresql://' + u + ':' + p + '@' + h + ':' + port + '/' + db + '?schema=public');
")

# Validate
if [[ "$DB_URL" != postgresql://* ]]; then
  echo "❌ Failed to compose DATABASE_URL"
  echo "   Parsed: '$DB_URL'"
  echo "   Check POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB in $ENV_FILE"
  exit 1
fi

# Write to prisma/.env (Prisma CLI reads this with highest priority)
cleanup() { rm -f "$PROJECT_ROOT/prisma/.env"; }
trap cleanup EXIT
echo "DATABASE_URL=\"$DB_URL\"" > "$PROJECT_ROOT/prisma/.env"

cd "$PROJECT_ROOT"
"$@"
