# Конвенции по папкам офиса

Коротко о том, что и куда складывать. Общие правила поведения — в
`global-instructions.md`.

## `.claude-plugin/`
Манифест плагина (`plugin.json`). Меняется редко — при добавлении новых офисных
команд или смене версии офиса.

## `employees/`
Один сотрудник = одна папка `employees/<role>/` со структурой:
- `SKILL.md` — обязательный. Frontmatter (`name`, `description`), роль,
  обязанности, **чек-лист качества**, список своих команд и референсов, правила
  эскалации, секция Performance Review.
- `commands/*.md` — slash-команды этого сотрудника (frontmatter `description` +
  `argument-hint`, тело — инструкция-промпт).
- `references/*` — шаблоны и материалы только этой роли.

Базовые роли: `research-analyst`, `content-strategist`, `sales-operator`,
`devops-engineer`, `finance-reviewer`. Пользовательские — в `employees/custom/`
(скелет в `employees/custom/TEMPLATE.md`, создаётся командой `/new-employee`).

## `commands/`
Офисные slash-команды, доступные независимо от роли: `/list-employees`,
`/deploy-to-gcp`, `/sync-with-gcp`, `/new-employee`, `/performance-review`.

## `references/`
Общие материалы офиса:
- `brand/` — брендбук, голос, визуальные правила.
- `company/` — описание LarmorSight, продукты, контекст.
- `templates/` — переиспользуемые шаблоны (project brief, performance review, …).

## `workspace/`
- `active/<project>/` — текущие проекты и задачи (рабочие файлы, черновики).
- `archive/` — завершённое; `archive/reviews/` — результаты performance review.
- `templates/` — заготовки для новых проектов.

Содержимое `workspace/active/` и `workspace/archive/` обычно **не коммитится**
(см. `.gitignore`) — это рабочее пространство, а не часть пакета офиса.

## `gcp-infra/`
Terraform-инфраструктура для облачных копий сотрудников (Cloud Run, Cloud
Storage, Secret Manager, опционально Cloud Scheduler). `*.tfvars` и состояние —
в `.gitignore`; коммитится только `*.tfvars.example`.

## `deploy-to-gcp.sh`
CLI: `./deploy-to-gcp.sh <employee-name>` — синхронизирует навыки сотрудника в
GCS и применяет Terraform для его Cloud Run-сервиса.

## `scripts/`
Вспомогательные shell-скрипты: `sync-skills.sh` (синхронизация навыков в Cloud
Storage без `terraform apply`; используется командой `/sync-with-gcp`),
`backup-office.sh` (архив пакета офиса, опционально в Cloud Storage).

## `CHANGELOG.md`
Краткая человекочитаемая сводка изменений пакета офиса (версионирование — git).
