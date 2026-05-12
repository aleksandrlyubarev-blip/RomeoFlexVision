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
| `google_project_service` | включает API: Run, Storage, Secret Manager, Artifact Registry, Cloud Build, Cloud Scheduler |
| `google_storage_bucket.skills` | бакет `<project_id>-larmorsight-skills` с навыками сотрудников (versioning вкл.) |
| `google_secret_manager_secret.anthropic_api_key` | секрет `larmorsight-anthropic-api-key` |
| `module.ai_employee` (for_each по `active_employees`) | на сотрудника: сервис-аккаунт, IAM (storage read, secret accessor), Cloud Run v2-сервис, опц. публичный invoker |
| `google_cloud_scheduler_job.employee_ping` | опц. (`enable_scheduler = true`): POST на `<url>/run` по `schedule_cron` |

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

Сборка и публикация образа — через `cloudbuild.yaml` (рекомендуется) или вручную:

```bash
gcloud artifacts repositories create larmorsight \
  --repository-format=docker --location=us-central1

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

Локальный прогон рантайма: `pip install -r employee-runtime/requirements.txt && \
LARMORSIGHT_EMPLOYEE=research-analyst ANTHROPIC_API_KEY=... python employee-runtime/app.py`
(без `LARMORSIGHT_SKILLS_BUCKET` сервис стартует с базовыми инструкциями и сообщает об этом в ответе).

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
- Снести сотрудника из облака: уберите его из `active_employees` и `terraform apply`.
- Полностью убрать инфраструктуру: `terraform destroy` (бакет с `force_destroy = false`
  не удалится, пока в нём есть объекты — это намеренно).
- Рекомендуется отдельно настроить Budget Alert в биллинге проекта.

## TODO (на будущее)
- [x] Реальный образ рантайма сотрудника (`employee-runtime/app.py`).
- [x] CI: сборка/публикация образа (`cloudbuild.yaml`).
- [ ] Cloud Build **trigger** (авто-сборка на push) + `terraform plan/apply` в pipeline
      (закомментированный шаг `terraform-apply` в `cloudbuild.yaml`).
- [ ] Backend для state в GCS (закомментирован в `providers.tf`).
- [ ] Бюджеты/алерты (`google_billing_budget`), детальные дашборды Cloud Monitoring.
- [ ] Аутентификация вызовов `POST /run` (сейчас Cloud Run-сервис приватный по умолчанию;
      `enable_scheduler` уже использует OIDC сервис-аккаунта сотрудника).
- [ ] При необходимости — Vertex AI для более тяжёлых агентов вместо/в дополнение к Cloud Run.
