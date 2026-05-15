# Changelog — LarmorSight AI Office

Обратный хронологический порядок. Полное версионирование офиса — это git; этот
файл — краткая человекочитаемая сводка изменений пакета `larmorsight-office/`.

## [Unreleased]
- —

## 0.6.0
### Добавлено
- **Cloud Monitoring** — `enable_alerts` (опционально) включает:
  - `google_monitoring_notification_channel.email` (если задан `alert_email`);
  - на каждого сотрудника из `active_employees` две политики:
    `employee_5xx` (любая 5xx за 5 минут на Cloud Run-сервисе сотрудника) и
    `employee_latency` (p95-латентность `/run` выше `alert_latency_threshold_ms`,
    по умолчанию 30 000 мс).
  Включён API `monitoring.googleapis.com`.
- Выходы Terraform: `alert_policy_5xx`, `alert_policy_latency`, `alert_notification_channel`.

### Изменено
- `terraform.tfvars.example`, `gcp-infra/README.md` (новая секция «Мониторинг и алерты»,
  таблица ресурсов, TODO) и `plugin.json` → `0.6.0`.

## 0.5.0
### Добавлено
- **Тесты рантайма сотрудника** — `gcp-infra/employee-runtime/test_app.py` (6 кейсов
  на pytest + FastAPI TestClient): метаданные `/`, `/healthz`, формирование
  системного промпта без подключённого GCS, валидация входа `/run`, корректный
  вызов Anthropic SDK с prompt caching (`cache_control: ephemeral`) и adaptive
  thinking, переопределение `max_tokens`. Anthropic-клиент мокается через
  `monkeypatch`.
- **`requirements-dev.txt`** (`pytest`, `httpx`) + `conftest.py` (готовит env).
- **CI** — шаг `Test employee runtime` в `.github/workflows/larmorsight-office-ci.yml`:
  `pip install -r requirements-dev.txt` + `pytest -q` в `employee-runtime/`.

### Изменено
- `plugin.json` → `0.5.0`.

## 0.4.0
### Добавлено
- **Cloud Build trigger** — `google_cloudbuild_trigger` (опционально, `enable_build_trigger`):
  при push в `build_branch` с изменениями в `larmorsight-office/gcp-infra/employee-runtime/**`
  собирает и публикует образ сотрудника по `cloudbuild.yaml`. Переменные
  `github_owner` / `github_repo` / `build_branch`. Требует подключения репозитория к
  Cloud Build (GitHub App — разовый шаг в консоли).
- **Репозиторий Artifact Registry** — `google_artifact_registry_repository` (опционально,
  `create_artifact_repo`); переменная `artifact_repo` (по умолчанию `larmorsight`).
- Выходы Terraform: `artifact_repo`, `build_trigger_id`.

### Изменено
- `cloudbuild.yaml`: каталог сборки вынесен в подстановку `_SOURCE_DIR` (по умолчанию
  `employee-runtime` для ручного запуска из `gcp-infra/`; trigger передаёт полный путь
  от корня репозитория). Закомментированный шаг `terraform-apply` поправлен (`cd` в `gcp-infra/`).
- `terraform.tfvars.example`, README офиса и `gcp-infra/README.md` — обновлены; `plugin.json` → `0.4.0`.

## 0.3.0
### Добавлено
- **Аутентификация вызовов `/run`** — переменная `invoker_members` в `gcp-infra`:
  выдаёт `roles/run.invoker` указанным принципалам на каждый Cloud Run-сервис
  сотрудника (M2M через OIDC). Cloud Run-сервисы остаются приватными по умолчанию.
- **`scripts/call-employee.sh`** — вызвать `/run` у развёрнутого сотрудника:
  находит URL (`terraform output employee_urls` / `gcloud run services describe`),
  получает identity token, делает `POST /run`, печатает ответ.
- **`/ask-employee <employee> <task>`** — slash-команда поверх `call-employee.sh`.
- **Бюджетный алерт** — опциональный `google_billing_budget` (создаётся, если задан
  `billing_account`) с порогами 50/90/100%; `budget_amount_usd` (по умолчанию 50).
  Включён API `billingbudgets.googleapis.com`.
- **CI офиса** — `.github/workflows/larmorsight-office-ci.yml`: валидирует `plugin.json`,
  компилирует `app.py`, проверяет синтаксис shell-скриптов, `terraform fmt`/`validate`
  (на изменения в `larmorsight-office/**`).

### Изменено
- Модуль `ai-employee` получил переменную `invoker_members` и соответствующие IAM-биндинги.
- `terraform.tfvars.example`, README офиса и `gcp-infra/README.md`, `folder-instructions.md` — обновлены.
- `plugin.json` → `0.3.0`.

## 0.2.0
### Добавлено
- **Рабочий рантайм AI-сотрудника для Cloud Run** — `gcp-infra/employee-runtime/app.py`:
  FastAPI-сервис, который на старте подтягивает навык сотрудника из Cloud Storage
  (`global-instructions.md` + `employees/<name>/SKILL.md` + `references/`), собирает
  «замороженный» системный промпт и в `POST /run` вызывает Anthropic Messages API
  с prompt caching, моделью `claude-opus-4-7`, adaptive thinking и стримингом.
  Плюс `requirements.txt` и обновлённый `Dockerfile`.
- **CI** — `gcp-infra/cloudbuild.yaml`: сборка и публикация образа сотрудника в
  Artifact Registry (опциональный закомментированный шаг `terraform apply`).
- **`scripts/sync-skills.sh`** — синхронизация навыков сотрудников в Cloud Storage
  (используется командой `/sync-with-gcp`).
- **`scripts/backup-office.sh`** — архив пакета офиса (без рабочего пространства,
  terraform-состояния и секретов) с опциональной загрузкой в Cloud Storage.

### Изменено
- `gcp-infra/employee-runtime/` теперь содержит рабочий рантайм вместо плейсхолдера
  (`server.py` удалён, добавлены `app.py` + `requirements.txt`).
- `gcp-infra/README.md` и корневой `README.md` обновлены под новый рантайм, CI и скрипты.

## 0.1.0
### Добавлено
- Первый релиз LarmorSight AI Office: локальный офис (5 базовых AI-сотрудников с
  `SKILL.md` + командами + референсами; `employees/custom/TEMPLATE.md`; офисные
  slash-команды `/list-employees`, `/deploy-to-gcp`, `/sync-with-gcp`,
  `/new-employee`, `/performance-review`; `global-instructions.md`,
  `folder-instructions.md`; общие референсы — брендбук, обзор компании, шаблоны;
  рабочее пространство `workspace/`).
- Terraform-скелет GCP (`gcp-infra/`): Cloud Run v2 на сотрудника через
  переиспользуемый модуль, бакет навыков Cloud Storage, секрет в Secret Manager,
  опциональный Cloud Scheduler; плейсхолдер-контейнер; `deploy-to-gcp.sh`.
