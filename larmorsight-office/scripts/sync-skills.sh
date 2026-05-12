#!/usr/bin/env bash
#
# sync-skills.sh — синхронизировать навыки AI-сотрудников LarmorSight в Cloud Storage.
# Облачные копии сотрудников (Cloud Run) читают навыки из этого бакета на старте.
#
# Использование:
#   ./scripts/sync-skills.sh <employee-name>     # только этот сотрудник (employees/<name>/)
#   ./scripts/sync-skills.sh --all               # все сотрудники + global-instructions.md + references/
#
# Имя бакета определяется в порядке приоритета:
#   1) env SKILLS_BUCKET
#   2) terraform -chdir=gcp-infra output -raw skills_bucket
#   3) переменная skills_bucket из gcp-infra/terraform.tfvars
#   4) "<project_id>-larmorsight-skills"  (project_id из env PROJECT_ID или из terraform.tfvars)
#
# ВНИМАНИЕ: используется `gsutil rsync -d` — лишние файлы на стороне бакета удаляются.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OFFICE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INFRA_DIR="$OFFICE_DIR/gcp-infra"
EMPLOYEES_DIR="$OFFICE_DIR/employees"

die() { echo "error: $*" >&2; exit 1; }
info() { echo ">> $*"; }

TARGET="${1:-}"
[ -n "$TARGET" ] || die "укажите <employee-name> или --all"

for bin in gsutil; do
  command -v "$bin" >/dev/null 2>&1 || die "не найден '$bin' — установите Google Cloud SDK"
done

tfvar() {
  local key="$1" file="$INFRA_DIR/terraform.tfvars"
  [ -f "$file" ] || { echo ""; return; }
  grep -E "^[[:space:]]*${key}[[:space:]]*=" "$file" | head -n1 | sed -E 's/^[^=]*=[[:space:]]*"?([^"]*)"?.*/\1/'
}

BUCKET="${SKILLS_BUCKET:-}"
if [ -z "$BUCKET" ] && command -v terraform >/dev/null 2>&1; then
  BUCKET="$(terraform -chdir="$INFRA_DIR" output -raw skills_bucket 2>/dev/null || true)"
fi
[ -n "$BUCKET" ] || BUCKET="$(tfvar skills_bucket)"
if [ -z "$BUCKET" ]; then
  PROJECT_ID="${PROJECT_ID:-$(tfvar project_id)}"
  [ -n "$PROJECT_ID" ] || die "не удалось определить бакет навыков — задайте SKILLS_BUCKET или project_id в terraform.tfvars"
  BUCKET="${PROJECT_ID}-larmorsight-skills"
fi
gsutil ls -b "gs://$BUCKET" >/dev/null 2>&1 || die "бакет gs://$BUCKET недоступен (создайте его через terraform apply в gcp-infra/)"

sync_one() {
  local name="$1" dir
  if [ -d "$EMPLOYEES_DIR/$name" ]; then dir="$EMPLOYEES_DIR/$name"
  elif [ -d "$EMPLOYEES_DIR/custom/$name" ]; then dir="$EMPLOYEES_DIR/custom/$name"
  else die "сотрудник '$name' не найден в $EMPLOYEES_DIR"; fi
  [ -f "$dir/SKILL.md" ] || die "у сотрудника '$name' нет SKILL.md"
  info "синхронизирую employees/$name -> gs://$BUCKET/employees/$name"
  gsutil -m rsync -r -d "$dir" "gs://$BUCKET/employees/$name"
}

if [ "$TARGET" = "--all" ]; then
  for d in "$EMPLOYEES_DIR"/*/ ; do
    name="$(basename "$d")"
    [ "$name" = "custom" ] && continue
    [ -f "$d/SKILL.md" ] && sync_one "$name"
  done
  for d in "$EMPLOYEES_DIR"/custom/*/ ; do
    [ -d "$d" ] || continue
    name="$(basename "$d")"
    [ -f "$d/SKILL.md" ] && sync_one "custom/$name" || true
  done
  info "синхронизирую global-instructions.md и references/"
  gsutil -m cp "$OFFICE_DIR/global-instructions.md" "gs://$BUCKET/global-instructions.md"
  gsutil -m rsync -r -d "$OFFICE_DIR/references" "gs://$BUCKET/references"
else
  sync_one "$TARGET"
  # общие материалы тоже обновим — они нужны рантайму любого сотрудника
  gsutil -m cp "$OFFICE_DIR/global-instructions.md" "gs://$BUCKET/global-instructions.md"
  gsutil -m rsync -r -d "$OFFICE_DIR/references" "gs://$BUCKET/references"
fi

info "готово. Чтобы облачные копии подхватили изменения, дождитесь рестарта ревизии Cloud Run"
info "или передеплойте сотрудника: ./deploy-to-gcp.sh <employee>"
