# GCP RoboQC Testbed — Deployment Runbook

E2E-инструкция: от пустого GCP-проекта до рабочего LangGraph + SGLang стенда
в europe-west4. Использует Compute Engine VM (основной путь) или Helm в GKE
(альтернатива).

## 0. Предварительные требования
- GCP проект с включённым биллингом.
- Квота `NVIDIA_A100_80GB_GPUS ≥ 1` в europe-west4 (см. IAM и Администрирование → Квоты).
- `gcloud` авторизован, проект выбран: `gcloud config set project $PROJECT_ID`.
- Terraform ≥ 1.9, `git`, `docker`.

## 1. Поднять инфраструктуру
```bash
cd larmorsight-office/gcp-infra
cp terraform.tfvars.example terraform.tfvars
# в terraform.tfvars раскомментируйте блок "RoboQC GPU testbed" и выставьте:
#   enable_testbed = true
#   testbed_region = "europe-west4"
#   testbed_zone   = "europe-west4-b"
terraform init
terraform plan -var enable_testbed=true
terraform apply -var enable_testbed=true
```
Появятся outputs:
- `testbed_external_ip`, `testbed_ssh_command`, `testbed_langgraph_url`, `testbed_sglang_primary_url`,
  `testbed_models_bucket`, `testbed_registry_repo_url`.

## 2. Собрать и запушить образ супервайзера
```bash
gcloud auth configure-docker europe-west4-docker.pkg.dev
docker build -t europe-west4-docker.pkg.dev/$PROJECT_ID/roboqc/rhaef-supervisor:latest .
docker push europe-west4-docker.pkg.dev/$PROJECT_ID/roboqc/rhaef-supervisor:latest
```
При первом буте VM startup-скрипт клонирует этот репо с ветки `claude/gcp-roboqc-testbed-Khbl8`,
поднимает `compose.gpu.yml` и синхронизирует модели из GCS-бакета (пустый бакет => SGLang
сам качает с HuggingFace, дольше).

## 3. Проверить, что стенд живой
```bash
$(terraform output -raw testbed_ssh_command)
# на VM:
docker ps
curl -fsS http://localhost:30000/health     # SGLang Qwen
curl -fsS http://localhost:8000/health      # LangGraph supervisor
```

## 4. Прогнать smoke-кейс
```bash
# локально (через IAP-tunnel на порт 8000):
gcloud compute start-iap-tunnel roboqc-testbed 8000 \
  --local-host-port=localhost:8000 --zone=europe-west4-b &

python -m rhaef_v2.agents.roboqc.cli run \
  --image gs://$PROJECT_ID-roboqc-models/fixtures/screw/screw_missing_a1.png \
  --workcell WC-12
```

## 5. Бенчмарк Qwen и Gemma
Досыпьте фикстуры в бакет:
```bash
gsutil -m cp -r local/fixtures/* gs://$PROJECT_ID-roboqc-models/fixtures/
```
На VM:
```bash
cd /opt/roboqc-testbed
pip install -e .
pip install -e ./roboqc_data
python scripts/bench_roboqc.py --model qwen --n 20 --out results/qwen.jsonl
# включите Gemma-profile:
docker compose -f compose.gpu.yml --profile gemma --env-file .env.testbed up -d sglang-gemma
export SGLANG_BASE_URL=http://sglang-gemma:30001/v1   # в supervisor'е перенаведём на Gemma
python scripts/bench_roboqc.py --model gemma --n 20 --out results/gemma.jsonl
python scripts/bench_roboqc/report.py results/qwen.jsonl results/gemma.jsonl --out docs/benchmarks
```
Отчёт в `docs/benchmarks/qwen-vs-gemma.md` и CSV рядом.

## 6. Авто-экономия
- Spot-VM сбрасывается в STOPPED при preemption — startup-скрипт повторно поднимает SGLang при рестарте.
- `auto_shutdown_cron = "0 19 * * *"` — стоп каждый вечер 19:00 UTC.
- `auto_start_cron = "0 7 * * 1-5"` — старт по будням 7:00 UTC.
- Cloud Monitoring алерт ``${name}: GPU idle > 30m`` пишет в логи и отправляет notification
  channel (добавьте свой email/PagerDuty вручную).

## 7. Снести
```bash
cd larmorsight-office/gcp-infra
terraform destroy -target=module.gpu_testbed -target=module.models_bucket
```
Это сносит только полигон — Cloud Run AI-сотрудники остаются нетронутыми.

## Troubleshooting
- **`docker compose` не видит GPU.** Убедитесь, что VM поднята по образу Deep Learning VM
  (cu124) и `nvidia-smi` работает. Драйвер выставляется флагом `install-nvidia-driver=True`.
- **SGLang качает модель часами.** Предварительно сложите веса в GCS-бакет полигона
  (`testbed_models_bucket` в outputs) — startup-скрипт сливает их в `/srv/models`.
- **`pip install langgraph` падает в CI.** Bench-workflow ставит `roboqc` extras и `langgraph` из
  pyproject; сверьтесь с версией Python 3.11.
