---
description: Синхронизировать навыки AI-сотрудников LarmorSight в Cloud Storage
argument-hint: "[employee-name | --all]"
allowed-tools: Bash
---

Синхронизируй навыки сотрудников (`SKILL.md` + `references/`) из локального
офиса в бакет Cloud Storage, который читают облачные копии сотрудников.

1. Определи имя бакета: переменная `skills_bucket` из
   `larmorsight-office/gcp-infra/terraform.tfvars` (или вывод
   `terraform -chdir=larmorsight-office/gcp-infra output -raw skills_bucket`).
2. Если аргумент — имя сотрудника, синхронизируй только `employees/<name>/`.
   Если `--all` или аргумент пуст — синхронизируй всех сотрудников плюс
   `larmorsight-office/global-instructions.md` и `larmorsight-office/references/`.
3. Используй `gsutil -m rsync -r -d <local> gs://<bucket>/<path>`. Перед запуском
   покажи команду оператору (флаг `-d` удаляет на стороне бакета лишние файлы).
4. Покажи итог: что синхронизировано, в какой путь.

Это действие меняет общий ресурс — подтверди у оператора перед запуском.

Аргумент: $ARGUMENTS
