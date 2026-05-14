# gcp-infra — облачная инфраструктура AI-сотрудников LarmorSight + RoboQC testbed

Terraform-скелет для развёртывания облачных копий AI-сотрудников (`../employees/`)
в Google Cloud Platform: Cloud Run-сервис на сотрудника, общий бакет Cloud Storage
с навыками, секрет с Anthropic API key в Secret Manager и (опционально) Cloud
Scheduler для периодического запуска.

Отдельный **полигон RoboQC** (A100 80GB + SGLang + LangGraph-супервайзер)
подключается опционально флагом `enable_testbed = true` — см. раздел "RoboQC GPU testbed".

> **Статус: skeleton.** HCL валиден (`terraform validate`), но рассчитан на ваш
> реальный GCP-проект и собранный образ рантайма. `terraform apply` ничего не
> ломает, но создаёт ресурсы (и расходы) — применяйте осознанно.

## Что создаётся (Cloud Run AI-сотрудники)

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
- (Для реального рантайма) собранный и запушенный образ сотрудника — см.
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
# или вручную:
gsutil -m rsync -r -d employees/research-analyst gs://<project_id>-larmorsight-skills/employees/research-analyst
```

Из Claude Code: `/deploy-to-gcp <employee>`, `/sync-with-gcp [employee|--all]`.

## Образ рантайма сотрудника

`employee-runtime/` содержит **плейсхолдер** (`server.py` — заглушка, отвечает
текстом; `Dockerfile` на `python:3.11-slim`). Замените на реальный рантайм
(загрузка `SKILL.md` из Cloud Storage по `LARMORSIGHT_SKILLS_BUCKET` /
`LARMORSIGHT_SKILL_PATH`, чтение `ANTHROPIC_API_KEY` из окружения, вызовы
Anthropic API, осмысленный HTTP-API). Сборка:

```bash
gcloud artifacts repositories create larmorsight \
  --repository-format=docker --location=us-central1
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/PROJECT_ID/larmorsight/larmorsight-employee:latest \
  larmorsight-office/gcp-infra/employee-runtime
# затем в terraform.tfvars:
# employee_image = "us-central1-docker.pkg.dev/PROJECT_ID/larmorsight/larmorsight-employee:latest"
```

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

## RoboQC GPU testbed

Полигон (`modules/gpu-testbed` + `modules/models-bucket`, подключён в `testbed.tf`)
поднимает 1×A100 80GB VM в `europe-west4-b`, бакет `<project>-roboqc-models` и
Artifact Registry-репозиторий `roboqc`. По умолчанию `enable_testbed = false`,
так что текущее поведение этого Terraform модуля не меняется.

### Что создаётся при `enable_testbed = true`

| Ресурс | Назначение |
|---|---|
| `google_compute_instance.testbed` | `a2-ultragpu-1g` (1×A100 80GB, 12 vCPU, 170 GiB) + 1× Local SSD 375 GB под `/srv/models`. Deep Learning VM (CUDA 12.4). Spot по умолчанию. |
| `google_storage_bucket.models` | `<project>-roboqc-models` (regional europe-west4, lifecycle NEARLINE 30d / COLDLINE 180d). |
| `google_artifact_registry_repository.roboqc` | Docker-репозиторий `roboqc` для образов SGLang + supervisor + bench. |
| `google_compute_firewall` (SGLang/LangGraph/IAP-SSH) | Сетевые правила для 30000-30010, 8000, 22 (из IAP). |
| `google_monitoring_dashboard.testbed` | Дашборд "RoboQC Testbed — A100" (GPU util, VRAM, CPU, net, custom `sglang/tokens_per_second`). |
| `google_monitoring_alert_policy.idle_gpu` | Алерт простоя GPU > 30 минут. |
| `google_cloud_scheduler_job.auto_shutdown` / `auto_start` | Авто-стоп в 19:00 UTC / старт 7:00 UTC пн-пт (cron настраивается). |

### Быстрый старт полигона

```bash
cd larmorsight-office/gcp-infra
# в terraform.tfvars раскомментируйте блок "RoboQC GPU testbed" и:
#   enable_testbed = true
#   testbed_region = "europe-west4"
#   testbed_zone   = "europe-west4-b"
terraform init   # первый раз подтянет modules/gpu-testbed и modules/models-bucket
terraform plan -var enable_testbed=true
terraform apply -var enable_testbed=true

# Подключитесь (IAP, публичный вход закрыт):
gcloud compute ssh roboqc-testbed --zone=europe-west4-b --tunnel-through-iap

# Проверьте сервисы:
docker ps                                                # ждём sglang-qwen + rhaef-supervisor
curl -s http://localhost:30000/health                    # SGLang
curl -s http://localhost:8000/health                     # LangGraph supervisor
```

### Стоимость и экономия
- **On-demand** a2-ultragpu-1g в europe-west4 — ≈11 €/ч = ≈7 900 €/мес 24/7.
- **Spot** — ≈70% дешевле, но может preempt'иться. `use_spot = true` по умолчанию.
- **Auto-shutdown cron** и **idle-GPU алерт** дают ещё — 60-70 % к экономии, если ночью и
  выходными полигон не нужен (блоки cron'а пустые => Scheduler не создаётся).
- Для прода на 24/7 переведите на Committed Use Discount (1-3 года, − 40-55 %).

### Снять только полигон

```bash
terraform destroy -target=module.gpu_testbed -target=module.models_bucket
# Cloud Run-сотрудники остаются нетронутыми.
```

## TODO (вне текущего скелета)
- [ ] Реальный образ рантайма сотрудника (`employee-runtime/`).
- [ ] CI/CD: Cloud Build trigger на сборку образа + `terraform plan/apply` в pipeline.
- [ ] Backend для state в GCS (закомментирован в `providers.tf`).
- [ ] Бюджеты/алерты (`google_billing_budget`), детальные дашборды Cloud Monitoring.
- [ ] GKE node-pool (Helm chart уже живёт в `infra/helm/roboqc-testbed/`, кластер — отдельный follow-up).
- [ ] При необходимости — Vertex AI для более тяжёлых агентов вместо/в дополнение к Cloud Run.
