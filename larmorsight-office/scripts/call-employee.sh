#!/usr/bin/env bash
#
# call-employee.sh — вызвать /run у развёрнутого в Cloud Run AI-сотрудника LarmorSight.
#
# Использование:
#   ./scripts/call-employee.sh <employee-name> "<task>" ["<context>"]
#
# URL сервиса определяется в порядке приоритета:
#   1) env EMPLOYEE_URL
#   2) terraform -chdir=gcp-infra output -json employee_urls  (ключ = имя сотрудника)
#   3) gcloud run services describe larmorsight-<slug> --region <region>
#
# Аутентификация: identity token из gcloud (M2M через OIDC). Активный аккаунт
# должен иметь roles/run.invoker на сервисе — см. variable invoker_members в gcp-infra
# (или allow_unauthenticated = true для публичного доступа).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OFFICE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INFRA_DIR="$OFFICE_DIR/gcp-infra"

die() { echo "error: $*" >&2; exit 1; }

EMP="${1:-}"
TASK="${2:-}"
CONTEXT="${3:-}"
[ -n "$EMP" ] || die "использование: call-employee.sh <employee-name> \"<task>\" [\"<context>\"]"
[ -n "$TASK" ] || die "не задана задача (второй аргумент)"

for bin in curl jq; do
  command -v "$bin" >/dev/null 2>&1 || die "не найден '$bin'"
done

tfvar() {
  local key="$1" file="$INFRA_DIR/terraform.tfvars"
  [ -f "$file" ] || { echo ""; return; }
  grep -E "^[[:space:]]*${key}[[:space:]]*=" "$file" | head -n1 | sed -E 's/^[^=]*=[[:space:]]*"?([^"]*)"?.*/\1/'
}

URL="${EMPLOYEE_URL:-}"
if [ -z "$URL" ] && command -v terraform >/dev/null 2>&1; then
  URL="$(terraform -chdir="$INFRA_DIR" output -json employee_urls 2>/dev/null | jq -r --arg e "$EMP" '.[$e] // empty' || true)"
fi
if [ -z "$URL" ] && command -v gcloud >/dev/null 2>&1; then
  REGION="${REGION:-$(tfvar region)}"; REGION="${REGION:-us-central1}"
  slug="$(printf '%s' "$EMP" | tr '[:upper:]_' '[:lower:]-')"
  URL="$(gcloud run services describe "larmorsight-$slug" --region "$REGION" --format='value(status.url)' 2>/dev/null || true)"
fi
[ -n "$URL" ] || die "не удалось определить URL сервиса сотрудника '$EMP' — задайте EMPLOYEE_URL или разверните его (./deploy-to-gcp.sh $EMP)"

if [ -n "${IDENTITY_TOKEN:-}" ]; then
  TOKEN="$IDENTITY_TOKEN"
else
  command -v gcloud >/dev/null 2>&1 || die "не найден gcloud для получения identity token (или задайте IDENTITY_TOKEN)"
  TOKEN="$(gcloud auth print-identity-token --audiences="$URL" 2>/dev/null || gcloud auth print-identity-token)"
fi
[ -n "$TOKEN" ] || die "не удалось получить identity token"

PAYLOAD="$(jq -n --arg t "$TASK" --arg c "$CONTEXT" 'if $c == "" then {task:$t} else {task:$t, context:$c} end')"

echo ">> POST $URL/run  (employee: $EMP)" >&2
RESP="$(curl -fsS -X POST "$URL/run" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")" || die "запрос не удался (проверьте права roles/run.invoker и что сервис развёрнут)"

# Печатаем текст ответа; usage — в stderr для справки.
echo "$RESP" | jq -r '.usage // {} | "[usage] " + (tojson)' >&2 || true
echo "$RESP" | jq -r '.output // .'
