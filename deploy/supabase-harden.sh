#!/usr/bin/env bash
# Chay tren MAY DEV, SAU khi backend khoi dong lan dau voi Supabase (Liquibase da tao bang va nap tu dien):
# chan Data API (deploy/supabase-hardening.sql) va in so dong de kiem tra.
#
# Can file .env.supabase o thu muc goc repo (gitignore), mot dong:
#   SUPABASE_DB_URL=postgresql://postgres.<project-ref>:<mat-khau>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
# Lay o Supabase: Connect -> Session pooler (KHONG dung Direct connection: chi IPv6). Mat khau co ky tu dac biet
# (@ : / ? # %) thi phai ma hoa URL, vd @ -> %40.
set -euo pipefail
cd "$(dirname "$0")/.."
export MSYS_NO_PATHCONV=1
[ -f .env.supabase ] || { echo "Thieu file .env.supabase (xem dau script)"; exit 1; }
SUPABASE_DB_URL=$(grep -E '^SUPABASE_DB_URL=' .env.supabase | head -1 | cut -d= -f2-)
[ -n "$SUPABASE_DB_URL" ] || { echo "Chua dat SUPABASE_DB_URL trong .env.supabase"; exit 1; }

HOST_DIR=$(pwd -W 2>/dev/null || pwd) # Git Bash tren Windows can duong dan dang D:/...
PG=(docker run --rm -e PGURL -v "$HOST_DIR/deploy:/deploy:ro" postgres:17-alpine) # mang: duong dan co dau cach
export PGURL="$SUPABASE_DB_URL"

echo "== Kiem tra ket noi"
"${PG[@]}" sh -c 'psql "$PGURL" -tAc "select version()"'

echo "== Chan Data API"
"${PG[@]}" sh -c 'psql "$PGURL" -v ON_ERROR_STOP=1 -q -f /deploy/supabase-hardening.sql'

echo "== Kiem tra so dong"
"${PG[@]}" sh -c 'psql "$PGURL" -tAc "select '"'"'words'"'"', count(*) from words union all select '"'"'users'"'"', count(*) from users union all select '"'"'game_histories'"'"', count(*) from game_histories"'
