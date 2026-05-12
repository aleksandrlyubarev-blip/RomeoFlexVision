---
description: Развернуть AI-сотрудника LarmorSight в GCP (Cloud Run) по требованию
argument-hint: "<employee-name>"
allowed-tools: Bash
---

Разверни сотрудника `$1` в Google Cloud Platform.

Это **рискованное действие** (изменение облачной инфраструктуры и потенциальные
расходы) — сначала кратко покажи оператору, что будет сделано, и дождись явного
подтверждения. Только после этого:

1. Проверь, что папка `larmorsight-office/employees/$1/` существует. Если нет —
   подскажи доступных сотрудников (см. `/list-employees`) и остановись.
2. Убедись, что заполнен `larmorsight-office/gcp-infra/terraform.tfvars`
   (минимум `project_id`, `region`, `employee_image`). Если файла нет — покажи
   `terraform.tfvars.example` и попроси заполнить.
3. Запусти `bash larmorsight-office/deploy-to-gcp.sh "$1"` и покажи вывод.
4. После завершения покажи URL сервиса (из вывода `terraform output`).

Не запускай ничего деструктивного и не меняй `terraform.tfvars` без подтверждения.

Аргумент: $ARGUMENTS
