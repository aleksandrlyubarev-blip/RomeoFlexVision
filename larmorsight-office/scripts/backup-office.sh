#!/usr/bin/env bash
#
# backup-office.sh — снимок офиса LarmorSight: tar.gz пакета офиса (без рабочего
# пространства, terraform-состояния и секретов) с временной меткой; опционально
# заливает архив в Cloud Storage.
#
# Использование:
#   ./scripts/backup-office.sh [target-dir]            # архив в target-dir (по умолчанию <office>/backups)
#   BACKUP_BUCKET=my-bucket ./scripts/backup-office.sh # дополнительно: gs://my-bucket/larmorsight-office/<archive>
#
# Версионирование офиса — это git; этот скрипт нужен для быстрых офлайн-снимков и
# архивов на случай, если что-то лежит вне git.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OFFICE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OFFICE_NAME="$(basename "$OFFICE_DIR")"
PARENT_DIR="$(cd "$OFFICE_DIR/.." && pwd)"

TARGET_DIR="${1:-$OFFICE_DIR/backups}"
mkdir -p "$TARGET_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE="$TARGET_DIR/${OFFICE_NAME}-${STAMP}.tar.gz"

echo ">> архивирую $OFFICE_DIR -> $ARCHIVE"
tar -czf "$ARCHIVE" \
  --exclude="${OFFICE_NAME}/workspace/active" \
  --exclude="${OFFICE_NAME}/workspace/archive" \
  --exclude="${OFFICE_NAME}/backups" \
  --exclude="${OFFICE_NAME}/gcp-infra/.terraform" \
  --exclude="${OFFICE_NAME}/gcp-infra/.terraform.lock.hcl" \
  --exclude='*.tfstate' --exclude='*.tfstate.*' --exclude='*.tfvars' \
  --exclude='__pycache__' --exclude='*.pyc' \
  --exclude='*.key' --exclude='*.pem' --exclude='gcp-service-account*.json' \
  --exclude='.env' --exclude='.env.*' \
  -C "$PARENT_DIR" "$OFFICE_NAME"

echo ">> готово: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

if [ -n "${BACKUP_BUCKET:-}" ]; then
  command -v gsutil >/dev/null 2>&1 || { echo "warn: gsutil не найден — пропускаю загрузку в GCS" >&2; exit 0; }
  echo ">> загружаю в gs://$BACKUP_BUCKET/larmorsight-office/"
  gsutil cp "$ARCHIVE" "gs://$BACKUP_BUCKET/larmorsight-office/$(basename "$ARCHIVE")"
  echo ">> загружено"
fi
