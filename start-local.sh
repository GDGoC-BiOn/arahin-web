#!/usr/bin/env bash
# Brings up the whole ArahIn stack for local testing:
#   postgres (throwaway) -> arahin-backend -> arahin-parser -> this app
#
# Migrations are applied in filename (timestamp) order; they are idempotent.
# Set AI_BASE_URL to arahin-ai to get real questions instead of stubs.
set -euo pipefail

BACKEND=~/Documents/arahin/arahin-backend
PARSER=~/Documents/arahin/arahin-parser
APP="$(cd "$(dirname "$0")" && pwd)"
export PATH=/opt/homebrew/opt/postgresql@17/bin:$PATH
export LC_ALL=C LANG=C

PG=$(mktemp -d /tmp/arahin-pg.XXXX)
echo "$PG" > /tmp/arahin-pgdir
echo "→ postgres ($PG)"
initdb -D "$PG/data" -U arahin --auth=trust >/dev/null 2>&1
pg_ctl -D "$PG/data" -o "-p 5433 -k $PG" -l "$PG/pg.log" start >/dev/null 2>&1
sleep 2
psql -h "$PG" -p 5433 -U arahin -d postgres -qc "CREATE DATABASE arahin;"
for f in "$BACKEND"/migrations/*.sql; do
  psql -h "$PG" -p 5433 -U arahin -d arahin -q -v ON_ERROR_STOP=1 -f "$f"
done

echo "→ backend :8080"
cd "$BACKEND"
DATABASE_URL="postgres://arahin@localhost:5433/arahin?sslmode=disable&host=$PG" \
JWT_SECRET="local-dev-secret" JWT_TTL_HOURS=8 APP_ENV=development PORT=8080 APP_URL=http://localhost:3000 GOOGLE_REDIRECT_URL=http://localhost:3000/api/auth/google/callback GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-}" GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-}" AI_BASE_URL="${AI_BASE_URL:-}" \
  nohup go run ./cmd/api > /tmp/arahin-backend.log 2>&1 &

echo "→ parser :8081"
cd "$PARSER"
PORT=8081 nohup npm run dev > /tmp/arahin-parser.log 2>&1 &

echo "→ app :3000"
cd "$APP"
(lsof -ti:3000 | xargs -r kill 2>/dev/null) || true
sleep 1
nohup pnpm dev > /tmp/arahin-dev.log 2>&1 &

for i in $(seq 1 40); do
  sleep 3
  b=$(curl -s -m2 -o /dev/null -w '%{http_code}' http://localhost:8080/healthz || true)
  n=$(curl -s -m2 -o /dev/null -w '%{http_code}' http://localhost:3000/masuk || true)
  if [ "$b" = "200" ] && [ "$n" = "200" ]; then echo "→ ready"; break; fi
done
echo -n "→ readyz: "; curl -s http://localhost:8080/readyz; echo
echo
echo "Open http://localhost:3000 — stop everything with ./stop-local.sh"
