#!/usr/bin/env bash
# ---------------------------------------------------------------
# CalibiAI seed runner (psql)
# Requires DATABASE_URL to be a service-role / postgres connection.
# Usage:
#   DATABASE_URL=postgres://... ./seed_supabase.sh
# ---------------------------------------------------------------
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_DIR="$SCRIPT_DIR/../sql"
DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required}"

echo "-> Running 99_seed_all.sql against $DATABASE_URL"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SQL_DIR/99_seed_all.sql"
echo "-> Done. Refreshing leaderboards..."
psql "$DATABASE_URL" -c "select public.refresh_leaderboards();"
