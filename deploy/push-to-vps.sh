#!/usr/bin/env bash
# Chay tren MAY DEV: chep code nhanh main len VPS (repo private, khong can token GitHub) roi build + khoi dong lai.
#   bash deploy/push-to-vps.sh [ssh-host]     (mac dinh: dongy-vps trong ~/.ssh/config)
# Du lieu (DB) nam trong Docker volume, khong bi anh huong.
set -euo pipefail
cd "$(dirname "$0")/.."
HOST="${1:-dongy-vps}"
DIR=/opt/doanchu
git archive --format=tar main | ssh "$HOST" "mkdir -p $DIR && tar -x -C $DIR"
ssh "$HOST" "cd $DIR && docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build && docker image prune -f >/dev/null"
