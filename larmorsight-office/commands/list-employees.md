---
description: Показать всех AI-сотрудников офиса LarmorSight и их роли
argument-hint: "[--cloud]"
---

Перечисли AI-сотрудников офиса LarmorSight.

1. Прочитай каталог `larmorsight-office/employees/` (исключая `custom/`, но
   перечисли и кастомных сотрудников из `employees/custom/*/`, если они есть).
2. Для каждого сотрудника открой `SKILL.md`, возьми из frontmatter `name` и
   `description`, и кратко (1 строка) опиши роль и его команды (`commands/*.md`).
3. Выведи компактной таблицей: **Сотрудник | Роль | Команды | Папка**.
4. Если в аргументах есть `--cloud` — дополнительно покажи, какие сотрудники
   объявлены в `larmorsight-office/gcp-infra/terraform.tfvars` (если файл есть)
   как развёрнутые/планируемые к развёртыванию (`active_employees`).

Аргументы: $ARGUMENTS
