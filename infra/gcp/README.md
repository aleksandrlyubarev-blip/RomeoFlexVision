# infra/gcp — GPU-полигон RoboQC (Terraform)

Автономный Terraform-корень GPU-полигона: 1×A100 80GB VM в `europe-west4`,
бакет моделей и Artifact Registry-репозиторий. Compute Engine — основной путь;
GKE-альтернатива живёт в `infra/helm/roboqc-testbed/`.

> **Статус: skeleton.** HCL рассчитан на ваш реальный GCP-проект. `terraform
> apply` создаёт ресурсы (и расходы) — применяйте осознанно. Полигон ещё ни
> разу не разворачивался: state пуст.

## Что создаётся

| Ресурс | Назначение |
|---|---|
| `google_project_service` | включает API: Compute, Storage, Artifact Registry, Cloud Scheduler, Monitoring, Logging |
| `module.models_bucket` | GCS-бакет `<project>-roboqc-models` (lifecycle NEARLINE 30d / COLDLINE 180d) + Artifact Registry-репозиторий `roboqc` |
| `module.gpu_testbed` | `a2-ultragpu-1g` (1×A100 80GB) + Local SSD под `/srv/models`, firewall (SGLang/LangGraph/IAP-SSH), Cloud Monitoring дашборд + idle-GPU алерт, опц. авто-стоп/старт |

## Быстрый старт

```bash
cd infra/gcp
cp terraform.tfvars.example terraform.tfvars
# заполните project_id

terraform init
terraform plan
terraform apply
```

Полная E2E-инструкция (сборка образа, smoke-кейс, бенчмарк) —
`docs/deployment-gcp-testbed.md`.

## Стоимость и экономия

- **On-demand** a2-ultragpu-1g в europe-west4 — ≈11 €/ч.
- **Spot** (`use_spot = true`, по умолчанию) — ≈70% дешевле, может preempt'иться.
- `testbed_auto_shutdown_cron` / `testbed_auto_start_cron` + idle-GPU алерт дают
  ещё −60-70% экономии, если ночью и выходными полигон не нужен.

## Снести

```bash
terraform destroy
```
