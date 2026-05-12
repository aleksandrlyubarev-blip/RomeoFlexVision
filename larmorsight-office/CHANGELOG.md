# Changelog — LarmorSight AI Office

Обратный хронологический порядок. Полное версионирование офиса — это git; этот
файл — краткая человекочитаемая сводка изменений пакета `larmorsight-office/`.

## [Unreleased]
- —

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
