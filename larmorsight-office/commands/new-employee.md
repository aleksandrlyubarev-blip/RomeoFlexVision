---
description: Создать нового AI-сотрудника LarmorSight из шаблона
argument-hint: "<employee-name> [\"краткое описание роли\"]"
---

Создай скелет нового AI-сотрудника `$1` в `larmorsight-office/employees/custom/$1/`.

1. Проверь, что папки `employees/custom/$1/` и `employees/$1/` ещё нет. Если есть —
   останови и предложи другое имя.
2. Создай:
   - `employees/custom/$1/SKILL.md` — на основе `employees/custom/TEMPLATE.md`,
     подставив имя `$1` и (если передано) описание роли из аргументов; оставь
     осмысленные плейсхолдеры для обязанностей и чек-листа.
   - `employees/custom/$1/commands/.gitkeep`
   - `employees/custom/$1/references/.gitkeep`
3. Открой созданный `SKILL.md` и предложи оператору заполнить: обязанности,
   чек-лист качества «готово/не готово», ключевые команды, нужные референсы.
4. Напомни: чтобы развернуть нового сотрудника в облаке, добавь его в
   `active_employees` в `gcp-infra/terraform.tfvars` и запусти `/deploy-to-gcp $1`.

Аргументы: $ARGUMENTS
