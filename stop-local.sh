#!/usr/bin/env bash
# Stops everything start-local.sh began and deletes the throwaway database.
export PATH=/opt/homebrew/opt/postgresql@17/bin:$PATH
pkill -f "next dev" 2>/dev/null || true
pkill -f "go run ./cmd/api" 2>/dev/null || true
pkill -f "exe/api" 2>/dev/null || true
pkill -f "arahin-parser" 2>/dev/null || true
for p in 3000 8080 8081; do lsof -ti:$p 2>/dev/null | xargs -r kill 2>/dev/null || true; done
PG=$(cat /tmp/arahin-pgdir 2>/dev/null || true)
if [ -n "$PG" ]; then pg_ctl -D "$PG/data" stop -m fast >/dev/null 2>&1 || true; rm -rf "$PG"; fi
rm -f /tmp/arahin-pgdir
echo "stopped — the test database is gone, so accounts go with it"
