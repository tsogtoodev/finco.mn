#!/usr/bin/env bash
# Nightly backup of the Directus SQLite database to Cloudflare R2.
# Requires: sqlite3, gzip, and rclone configured with an R2 remote named "r2".
#   rclone config  ->  new remote "r2", type=s3, provider=Cloudflare,
#                      access_key_id / secret_access_key = R2 token,
#                      endpoint = https://<ACCOUNT_ID>.r2.cloudflarestorage.com
set -euo pipefail

DB_PATH="/home/finco/directus/database/data.db"
BACKUP_DIR="/home/finco/directus/backups"
BUCKET="r2:finco-cms-backups"          # a SEPARATE bucket from your media bucket
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${BACKUP_DIR}/data-${STAMP}.db"

mkdir -p "$BACKUP_DIR"

# SQLite online backup — safe to run while Directus is writing; will not corrupt the live DB.
sqlite3 "$DB_PATH" ".backup '${OUT}'"
gzip "$OUT"

# Upload to R2, then prune local copies older than 7 days.
rclone copy "${OUT}.gz" "$BUCKET"
find "$BACKUP_DIR" -name '*.gz' -mtime +7 -delete

echo "Backup complete: data-${STAMP}.db.gz -> ${BUCKET}"
