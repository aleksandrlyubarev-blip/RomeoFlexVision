---
description: Спросить развёрнутого в облаке AI-сотрудника LarmorSight (вызывает его /run)
argument-hint: "<employee-name> <задача...>"
allowed-tools: Bash
---

Передай задачу облачной копии сотрудника LarmorSight (Cloud Run) и покажи ответ.

Это вызывает развёрнутый сервис и расходует токены Anthropic API — выполняй, если
оператор этого хочет; для рискованных действий сам сотрудник всё равно вернёт
только описание и попросит подтверждения (см. `global-instructions.md`).

1. Первый токен аргументов — имя сотрудника (`$1`), остальное — задача.
2. Проверь, что папка `larmorsight-office/employees/$1/` существует (или
   `employees/custom/$1/`). Если нет — подскажи доступных (`/list-employees`) и остановись.
3. Запусти: `bash larmorsight-office/scripts/call-employee.sh "$1" "<остальные аргументы как задача>"`.
   (Скрипт сам найдёт URL сервиса через `terraform output employee_urls` или `gcloud run services describe`,
   получит OIDC identity token и сделает `POST /run`.)
4. Покажи `output` из ответа; при ошибке доступа напомни про `roles/run.invoker`
   (переменная `invoker_members` в `gcp-infra/terraform.tfvars`) и что сотрудник
   должен быть развёрнут (`/deploy-to-gcp $1`).

Если нужен длинный или структурированный контекст — передай его третьим аргументом
скрипту в кавычках.

Аргументы: $ARGUMENTS
