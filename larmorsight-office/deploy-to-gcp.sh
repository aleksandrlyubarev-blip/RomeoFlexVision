#!/usr/bin/env bash
#
# deploy-to-gcp.sh — развернуть/обновить одного AI-сотрудника LarmorSight в GCP.
#
# Что делает (скелет — рассчитан на ВАШ реальный GCP-проект и собранный образ):
#   1. Проверяет, что папка employees/<name>/ существует локально.
#   2. Проверяет наличие инструментов: gcloud, gsutil, terraform, jq.
#   3. Синхронизирует навыки сотрудника (SKILL.md + references/) и общие материалы
#      офиса (global-instructions.md, references/) в бакет Cloud Storage.
#   4. Запускает terraform apply в gcp-infra/, добавляя сотрудника в active_employees.
#   5. Печатает URL Cloud Run-сервиса сотрудника.
#
# ВАЖНО: это меняет облачную инфраструктуру и может приводить к расходам.
# Запускайте осознанно; terraform покажет план перед применением.
#
# Использование:
#   ./deploy-to-gcp.sh <employee-name>
#
# Переменные окружения (необязательные, переопределяют значения из terraform.tfvars):
#   PROJECT_ID, REGION, SKILLS_BUCKET, AUTO_APPROVE=1
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OFFICE_DIR="$SCRIPT_DIR"
INFRA_DIR="$OFFICE_DIR/gcp-infra"
EMPLOYEES_DIR="$OFFICE_DIR/employees"

die() { echo "error: $*" >&2; exit 1; }
info() { echo ">> $*"; }

# --- args --------------------------------------------------------------------
EMPLOYEE="${1:-}"
[ -n "$EMPLOYEE" ] || die "укажите имя сотрудника: ./deploy-to-gcp.sh <employee-name>"

EMPLOYEE_DIR=""
if [ -d "$EMPLOYEES_DIR/$EMPLOYEE" ]; then
  EMPLOYEE_DIR="$EMPLOYEES_DIR/$EMPLOYEE"
elif [ -d "$EMPLOYEES_DIR/custom/$EMPLOYEE" ]; then
  EMPLOYEE_DIR="$EMPLOYEES_DIR/custom/$EMPLOYEE"
else
  echo "Доступные сотрудники:" >&2
  ( cd "$EMPLOYEES_DIR" && ls -d */ 2>/dev/null | sed 's#/$##' ; ls -d custom/*/ 2>/dev/null | sed 's#/$##' ) >&2 || true
  die "сотрудник '$EMPLOYEE' не найден в $EMPLOYEES_DIR"
fi
[ -f "$EMPLOYEE_DIR/SKILL.md" ] || die "у сотрудника '$EMPLOYEE' нет SKILL.md ($EMPLOYEE_DIR)"

# --- prerequisites -----------------------------------------------------------
for bin in gcloud gsutil terraform jq; do
  command -v "$bin" >/dev/null 2>&1 || die "не найден '$bin' — установите Google Cloud SDK / Terraform / jq"
done
[ -d "$INFRA_DIR" ] || die "нет каталога инфраструктуры: $INFRA_DIR"

# --- config (env > terraform.tfvars) ----------------------------------------
tfvar() {
  # читает строковое значение переменной из gcp-infra/terraform.tfvars (если файл есть)
  local key="$1" file="$INFRA_DIR/terraform.tfvars"
  [ -f "$file" ] || { echo ""; return; }
  grep -E "^[[:space:]]*${key}[[:space:]]*=" "$file" | head -n1 | sed -E 's/^[^=]*=[[:space:]]*"?([^"]*)"?.*/\1/'
}

PROJECT_ID="${PROJECT_ID:-$(tfvar project_id)}"
REGION="${REGION:-$(tfvar region)}"
[ -n "$PROJECT_ID" ] || die "не задан project_id — заполните $INFRA_DIR/terraform.tfvars (см. terraform.tfvars.example) или экспортируйте PROJECT_ID"
REGION="${REGION:-us-central1}"
SKILLS_BUCKET="${SKILLS_BUCKET:-$(tfvar skills_bucket)}"
SKILLS_BUCKET="${SKILLS_BUCKET:-${PROJECT_ID}-larmorsight-skills}"

APPROVE_FLAG=""
[ "${AUTO_APPROVE:-0}" = "1" ] && APPROVE_FLAG="-auto-approve"

info "сотрудник:     $EMPLOYEE  ($EMPLOYEE_DIR)"
info "GCP project:   $PROJECT_ID"
info "регион:        $REGION"
info "skills bucket: gs://$SKILLS_BUCKET"

# --- 1) синхронизация навыков в Cloud Storage --------------------------------
info "синхронизирую навыки сотрудника и общие материалы офиса в Cloud Storage..."
# бакет должен существовать (его создаёт terraform); на самом первом запуске
# сначала прогоните terraform apply, затем повторите деплой сотрудника.
if gsutil ls -b "gs://$SKILLS_BUCKET" >/dev/null 2>&1; then
  gsutil -m rsync -r -d "$EMPLOYEE_DIR" "gs://$SKILLS_BUCKET/employees/$EMPLOYEE"
  gsutil -m cp "$OFFICE_DIR/global-instructions.md" "gs://$SKILLS_BUCKET/global-instructions.md"
  gsutil -m rsync -r -d "$OFFICE_DIR/references" "gs://$SKILLS_BUCKET/references"
else
  echo "   (!) бакет gs://$SKILLS_BUCKET ещё не создан — terraform создаст его на этом прогоне;"
  echo "       после успешного apply запустите ./deploy-to-gcp.sh $EMPLOYEE ещё раз для синхронизации навыков."
fi

# --- 2) вычисляем новый список active_employees ------------------------------
cd "$INFRA_DIR"
info "terraform init..."
terraform init -input=false >/dev/null

CURRENT_JSON="$(terraform output -json active_employees 2>/dev/null || echo '[]')"
NEW_JSON="$(printf '%s\n' "$CURRENT_JSON" | jq -c --arg e "$EMPLOYEE" '(. // []) + [$e] | unique')"
info "active_employees после деплоя: $NEW_JSON"

# --- 3) plan + apply ---------------------------------------------------------
info "terraform plan..."
terraform plan -input=false \
  -var="project_id=$PROJECT_ID" \
  -var="region=$REGION" \
  -var="active_employees=$NEW_JSON"

if [ -z "$APPROVE_FLAG" ]; then
  read -r -p "Применить эти изменения в GCP? [y/N] " ans
  case "$ans" in y|Y|yes|YES) ;; *) die "отменено пользователем" ;; esac
fi

info "terraform apply..."
terraform apply $APPROVE_FLAG -input=false \
  -var="project_id=$PROJECT_ID" \
  -var="region=$REGION" \
  -var="active_employees=$NEW_JSON"

# --- 4) вывод ----------------------------------------------------------------
URL="$(terraform output -json employee_urls 2>/dev/null | jq -r --arg e "$EMPLOYEE" '.[$e] // empty')"
if [ -n "$URL" ]; then
  info "готово. Сотрудник '$EMPLOYEE' доступен по адресу: $URL"
else
  info "готово. См. 'terraform -chdir=$INFRA_DIR output employee_urls' для URL сервисов."
fi

cat <<'NOTE'

Дальше:
  - Если это был самый первый apply (бакет только что создан) — запустите скрипт
    ещё раз, чтобы загрузить навыки сотрудника в Cloud Storage.
  - Снести сотрудника из облака: уберите его из active_employees в terraform.tfvars
    и выполните `terraform -chdir=gcp-infra apply`.
  - Образ контейнера сотрудника (variable employee_image) нужно собрать и
    запушить отдельно — см. gcp-infra/employee-runtime/Dockerfile и gcp-infra/README.md.
NOTE
