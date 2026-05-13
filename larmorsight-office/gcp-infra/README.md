# gcp-infra — облачная инфраструктура AI-сотрудников LarmorSight

Terraform-скелет для развёртывания облачных копий AI-сотрудников (`../employees/`)
в Google Cloud Platform: Cloud Run-сервис на сотрудника, общий бакет Cloud Storage
с навыками, секрет с Anthropic API key в Secret Manager и (опционально) Cloud
Scheduler для периодического запуска.

> **Статус: рабочая основа.** HCL валиден (`terraform validate`); рантайм
> сотрудника (`employee-runtime/`) реальный (FastAPI + Anthropic Messages API,
> prompt caching, модель `claude-opus-4-7`). Рассчитано на ваш реальный
> GCP-проект и собранный образ. `terraform apply` создаёт ресурсы (и расходы) —
> применяйте осознанно.

## Что создаётся

| Ресурс | Назначение |
|---|---|
| `google_project_service` | включает API: Run, Storage, Secret Manager, Artifact Registry, Cloud Build, Cloud Scheduler, Billing Budgets |
| `google_storage_bucket.skills` | бакет `<project_id>-larmorsight-skills` с навыками сотрудников (versioning вкл.) |
| `google_secret_manager_secret.anthropic_api_key` | секрет `larmorsight-anthropic-api-key` |
| `module.ai_employee` (for_each по `active_employees`) | на сотрудника: сервис-аккаунт, IAM (storage read, secret accessor), Cloud Run v2-сервис, invoker для `invoker_members` (+ опц. публичный invoker при `allow_unauthenticated`) |
| `google_cloud_scheduler_job.employee_ping` | опц. (`enable_scheduler = true`): POST на `<url>/run` по `schedule_cron`, OIDC сервис-аккаунта сотрудника |
| `google_billing_budget.larmorsight` | опц. (если задан `billing_account`): месячный бюджет `budget_amount_usd` с алертами 50/90/100% |
| `google_artifact_registry_repository.larmorsight` | опц. (`create_artifact_repo = true`): Docker-репозиторий `artifact_repo` для образа сотрудника |
| `google_cloudbuild_trigger.employee_image` | опц. (`enable_build_trigger = true`): авто-сборка образа сотрудника при push в `build_branch` (по `cloudbuild.yaml`) |

## Предпосылки
- Terraform ≥ 1.9, `gcloud` (Google Cloud SDK), `gsutil`, `jq`.
- GCP-проект с включённым биллингом; у вас есть права создавать ресурсы.
- (Для реального рантажа) собранный и запушенный образ сотрудника — см.
  `employee-runtime/Dockerfile`.

## Быстрый старт

```bash
cd larmorsight-office/gcp-infra
cp terraform.tfvars.example terraform.tfvars
# отредактируйте project_id, region, active_employees, (позже) employee_image

terraform init
terraform plan
terraform apply        # создаёт бакет, секрет, сервисы для active_employees
```

Загрузить навыки сотрудников в бакет (после первого apply):

```bash
cd ..
./deploy-to-gcp.sh research-analyst       # синхронизирует навыки + apply с этим сотрудником
./scripts/sync-skills.sh --all            # только синхронизация навыков (без terraform apply)
# или вручную:
gsutil -m rsync -r -d employees/research-analyst gs://<project_id>-larmorsight-skills/employees/research-analyst
```

Из Claude Code: `/deploy-to-gcp <employee>`, `/sync-with-gcp [employee|--all]`.

## Образ рантайма сотрудника

`employee-runtime/` — рабочий рантайм:
- `app.py` — FastAPI-сервис. На старте подтягивает навык из Cloud Storage
  (`global-instructions.md` + `employees/<name>/SKILL.md` + `employees/<name>/references/`
  + общие `references/brand/...`, `references/company/...`) по переменным
  `LARMORSIGHT_SKILLS_BUCKET` / `LARMORSIGHT_SKILL_PATH`, собирает «замороженный»
  системный промпт. `POST /run` (`{"task": "...", "context": "..."}`) вызывает
  Anthropic Messages API с prompt caching, моделью `claude-opus-4-7`, adaptive
  thinking и стримингом; `GET /healthz` — проверка живости. `ANTHROPIC_API_KEY`
  инъектится из Secret Manager (см. ниже). Тюнинг через env: `LARMORSIGHT_MODEL`,
  `LARMORSIGHT_EFFORT`, `LARMORSIGHT_THINKING`, `LARMORSIGHT_MAX_TOKENS`.
- `requirements.txt` — `anthropic`, `google-cloud-storage`, `fastapi`, `uvicorn`, `pydantic`.
- `Dockerfile` — `python:3.11-slim`, `uvicorn app:app` на `$PORT`.

Репозиторий Artifact Registry: создайте вручную или через Terraform
(`create_artifact_repo = true`):

```bash
gcloud artifacts repositories create larmorsight \
  --repository-format=docker --location=us-central1
```

Сборка и публикация образа:

```bash
# вариант A — Cloud Build по конфигу (из larmorsight-office/gcp-infra):
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_REPO=larmorsight,_TAG=latest .

# вариант B — напрямую:
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/PROJECT_ID/larmorsight/larmorsight-employee:latest \
  employee-runtime

# затем в terraform.tfvars:
# employee_image = "us-central1-docker.pkg.dev/PROJECT_ID/larmorsight/larmorsight-employee:latest"
```

**Авто-сборка (Cloud Build trigger).** Подключите репозиторий к Cloud Build
(GitHub App, разовый шаг в консоли GCP), затем в `terraform.tfvars`:
`enable_build_trigger = true` (+ при необходимости `github_owner` / `github_repo` /
`build_branch`). Terraform создаст trigger `larmorsight-employee-image`, который при
push в `build_branch` с изменениями в `larmorsight-office/gcp-infra/employee-runtime/**`
запускает `cloudbuild.yaml` (триггер передаёт `_SOURCE_DIR=larmorsight-office/gcp-infra/employee-runtime`,
т.к. сборка идёт из корня репозитория).

Локальный прогон рантайма: `pip install -r employee-runtime/requirements.txt && \
LARMORSIGHT_EMPLOYEE=research-analyst ANTHROPIC_API_KEY=... python employee-runtime/app.py`
(без `LARMORSIGHT_SKILLS_BUCKET` сервис стартует с базовыми инструкциями и сообщает об этом в ответе).

Тесты рантайма (pytest + FastAPI TestClient, Anthropic SDK мокается):

```bash
cd employee-runtime
pip install -r requirements-dev.txt
pytest -q
```

То же запускается в CI на каждое изменение в `larmorsight-office/**`
(см. `.github/workflows/larmorsight-office-ci.yml`).

## Вызов /run у развёрнутого сотрудника

Cloud Run-сервисы приватные. Чтобы вызывать их (скриптом или командой `/ask-employee`),
выдайте `roles/run.invoker` нужным принципалам через `invoker_members` в `terraform.tfvars`:

```hcl
invoker_members = ["user:me@example.com", "serviceAccount:caller@PROJECT.iam.gserviceaccount.com"]
```

затем:

```bash
cd ..
./scripts/call-employee.sh research-analyst "Кратко: что такое RHAEF v2 и для чего он?"
# скрипт сам найдёт URL (terraform output employee_urls / gcloud run services describe),
# возьмёт identity token из gcloud и сделает POST /run.
```

Из Claude Code: `/ask-employee research-analyst <задача>`.

## Секрет Anthropic API key

Не храните ключ в `terraform.tfvars`. Заведите версию секрета вручную (или из CI):

```bash
echo -n "$ANTHROPIC_API_KEY" | gcloud secrets versions add larmorsight-anthropic-api-key --data-file=-
```

(Переменная `anthropic_api_key` существует для удобства локальных тестов, но она
`sensitive` и попадёт в state — для прода используйте ручную/CI-загрузку версии.)

## Контроль расходов
- `min_instance_count = 0` — сервисы скейлятся в ноль, когда не используются.
- `employee_max_instances` ограничивает потолок инстансов.
- Бюджетный алерт: задайте `billing_account` (и при желании `budget_amount_usd`) —
  Terraform создаст `google_billing_budget` с порогами 50/90/100%. Нужны права
  `billing.budgets.*` на биллинг-аккаунте.
- Снести сотрудника из облака: уберите его из `active_employees` и `terraform apply`.
- Полностью убрать инфраструктуру: `terraform destroy` (бакет с `force_destroy = false`
  не удалится, пока в нём есть объекты — это намеренно).

## TODO (на будущее)
- [x] Реальный образ рантайма сотрудника (`employee-runtime/app.py`).
- [x] CI: сборка/публикация образа (`cloudbuild.yaml`) + валидация офиса (`.github/workflows/`).
- [x] Аутентификация вызовов `POST /run` (`invoker_members` → `roles/run.invoker`; сервисы приватные по умолчанию).
- [x] Бюджетный алерт (`google_billing_budget`, опционально через `billing_account`).
- [x] Cloud Build **trigger** на push (`google_cloudbuild_trigger`, опционально через `enable_build_trigger`)
      + опц. репозиторий Artifact Registry (`create_artifact_repo`).
- [ ] `terraform plan/apply` внутри пайплайна (закомментированный шаг `terraform-apply` в `cloudbuild.yaml`;
      требует backend для state + сервис-аккаунт с правами).
- [ ] Backend для state в GCS (закомментирован в `providers.tf`).
- [ ] Детальные дашборды Cloud Monitoring / алерты на ошибки сервисов.
- [ ] При необходимости — Vertex AI для более тяжёлых агентов вместо/в дополнение к Cloud Run.
