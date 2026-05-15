# LarmorSight AI Office

Цифровой офис LarmorSight для Claude Code / Claude Cowork: набор AI-сотрудников
(плагины с навыками), общие slash-команды, единый брендбук и инструменты
развёртывания тех же сотрудников в облаке Google Cloud Platform по требованию.

> Статус: **v0.7 — локальный офис + рабочий рантайм для Cloud Run + CI/CD + тесты + мониторинг + GCS-state.**
> Terraform валиден, рантайм сотрудника реальный (FastAPI + Anthropic API, prompt
> caching, модель `claude-opus-4-7`) и покрыт тестами (pytest, Anthropic-клиент
> мокается), Cloud Run-сервисы приватные (доступ через `invoker_members`), есть
> опциональные бюджетный алерт, Artifact Registry, Cloud Build trigger и Cloud
> Monitoring алерты (5xx и p95-латентность), плюс CI офиса в GitHub Actions.
> Рассчитано на ваш реальный GCP-проект и собранный образ; сам `terraform apply` /
> деплой в этот пакет не входят. См. `CHANGELOG.md`.

## Что внутри

```
larmorsight-office/
├── .claude-plugin/plugin.json   # манифест плагина
├── global-instructions.md       # тон и стандарты для всех сотрудников
├── folder-instructions.md       # что и куда складывать
├── CHANGELOG.md                 # сводка изменений пакета
├── deploy-to-gcp.sh             # развернуть одного сотрудника в GCP (CLI)
├── commands/                    # офисные slash-команды (/list-employees, /deploy-to-gcp,
│                                #   /sync-with-gcp, /new-employee, /performance-review, /ask-employee)
├── scripts/                     # вспомогательные shell-скрипты
│   ├── sync-skills.sh           #   синхронизация навыков в Cloud Storage
│   ├── call-employee.sh         #   вызвать /run у развёрнутого сотрудника (OIDC)
│   └── backup-office.sh         #   снимок/архив пакета офиса
├── employees/                   # AI-сотрудники (по папке на роль)
│   ├── research-analyst/
│   ├── content-strategist/
│   ├── sales-operator/
│   ├── devops-engineer/
│   ├── finance-reviewer/
│   └── custom/                  # шаблон для ваших собственных сотрудников
├── references/                  # брендбук, шаблоны, описание компании
├── workspace/                   # активные и архивные рабочие задачи
└── gcp-infra/                   # Terraform (Cloud Run + Cloud Storage + Secret Manager;
    │                            #   опц.: бюджетный алерт, Artifact Registry, Cloud Build trigger)
    ├── employee-runtime/        #   рантайм сотрудника (app.py, requirements.txt, Dockerfile)
    └── cloudbuild.yaml          #   сборка и публикация образа сотрудника

# CI офиса: ../.github/workflows/larmorsight-office-ci.yml (валидация при изменениях в larmorsight-office/**)
```

## Быстрый старт (локально)

1. **Подключить офис как плагин.** Из Claude Code:
   ```
   /plugin marketplace add ./larmorsight-office
   /plugin install larmorsight-office
   ```
   (либо добавьте каталог `larmorsight-office/` в свой проектный плагин-маркетплейс —
   см. документацию Claude Code по плагинам.)
2. **Посмотреть сотрудников:** `/list-employees`
3. **Активировать сотрудника:** упомяните его в задаче — навык `employees/<role>/SKILL.md`
   подскажет Claude роль, чек-листы и ссылки на шаблоны.
4. **Новый сотрудник:** `/new-employee <name>` — создаёт скелет в `employees/custom/<name>/`
   из `employees/custom/TEMPLATE.md`.

## Быстрый старт (облако, GCP)

Подробности — в [`gcp-infra/README.md`](gcp-infra/README.md). Кратко:

```bash
cd larmorsight-office/gcp-infra
cp terraform.tfvars.example terraform.tfvars   # заполнить project_id, region

# Собрать и запушить образ рантайма сотрудника (один раз / в CI):
gcloud artifacts repositories create larmorsight --repository-format=docker --location=us-central1
gcloud builds submit --config cloudbuild.yaml .          # см. cloudbuild.yaml
# затем впишите получившийся образ как employee_image в terraform.tfvars

terraform init && terraform plan

# Развернуть конкретного сотрудника в Cloud Run (синхронизирует навыки + terraform apply):
cd ..
./deploy-to-gcp.sh research-analyst
```

В Claude Code то же самое: `/deploy-to-gcp research-analyst`, `/sync-with-gcp`.
Только синхронизация навыков без деплоя: `./scripts/sync-skills.sh --all`. Снимок офиса: `./scripts/backup-office.sh`.

**Спросить развёрнутого сотрудника** (Cloud Run-сервисы приватные — выдайте себе доступ
через `invoker_members` в `gcp-infra/terraform.tfvars`):

```bash
./scripts/call-employee.sh research-analyst "Кратко: что такое RHAEF v2?"
```

В Claude Code: `/ask-employee research-analyst <задача>`.

## Принципы

- **Модульность.** Один сотрудник = одна самодостаточная папка в `employees/`.
- **Качество через чек-листы.** В каждом `SKILL.md` есть конкретный чек-лист
  «готово/не готово».
- **Performance review.** Регулярная оценка сотрудников по
  [`references/templates/performance-review.md`](references/templates/performance-review.md).
- **Friction в критичных местах.** Рискованные действия (деплой, удаление,
  внешние рассылки) требуют явного подтверждения человека — см.
  [`global-instructions.md`](global-instructions.md).
- **Код — по стандартам репозитория.** Для инженерных задач сотрудники следуют
  `../CODING_STANDARDS.md` и `../AGENTS.md`.
