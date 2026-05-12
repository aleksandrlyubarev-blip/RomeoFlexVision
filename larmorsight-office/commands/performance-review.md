---
description: Провести performance review AI-сотрудника LarmorSight
argument-hint: "<employee-name> [period]"
---

Проведи performance review сотрудника `$1` за период `$2` (по умолчанию — текущий
спринт/месяц), используя шаблон `larmorsight-office/references/templates/performance-review.md`.

1. Прочитай `employees/$1/SKILL.md` (роль, обязанности, текущий чек-лист).
2. Просмотри его недавние артефакты в `workspace/active/` и `workspace/archive/`
   (если есть) и прошлые ревью в `workspace/archive/reviews/`.
3. Заполни шаблон: достижения, качество (по чек-листу из `SKILL.md`), проблемы,
   рекомендации, конкретные изменения в `SKILL.md`/чек-листе на следующий период.
4. Сохрани результат в `workspace/archive/reviews/$1-<YYYY-MM>.md`.
5. Если по итогам ревью нужно обновить `employees/$1/SKILL.md` — предложи
   оператору правки и внеси их после подтверждения.

Аргументы: $ARGUMENTS
