# roboqc-testbed (Helm)

Продакшен-путь разворачивания полигона в GKE (альтернатива Compute Engine VM в
`larmorsight-office/gcp-infra/modules/gpu-testbed`).

## Предпосылки
- GKE кластер с GPU node-pool, образ NVIDIA driver installer развёрнут (`daemonset` от Google).
- A100 либо A100 80GB ноды (lab `cloud.google.com/gke-accelerator=nvidia-a100-80gb`).
- Artifact Registry-репозиторий с образом `rhaef-supervisor`.

## Install

```bash
helm install roboqc infra/helm/roboqc-testbed \
  --namespace roboqc --create-namespace \
  --set image.supervisor.repository=europe-west4-docker.pkg.dev/PROJECT/roboqc/rhaef-supervisor \
  --set sglang.qwen.enabled=true \
  --set sglang.gemma.enabled=false

kubectl -n roboqc get pods
kubectl -n roboqc port-forward svc/roboqc-roboqc-testbed-supervisor 8000:8000
```

## Side-by-side benchmark

```bash
helm upgrade roboqc infra/helm/roboqc-testbed \
  --reuse-values --set sglang.gemma.enabled=true
# переключение между моделями в супервайзере — через переменные окружения / model_router
```

## Примечания
- GKE-кластер и GPU node-pool в чарт НЕ входят (намеренно). Создавайте их внешне (gcloud / Terraform).
- `modelsPvc` по умолчанию использует `standard-rwo`; для быстрого кэша подключите local-ssd.
- `serviceMonitor.enabled = true` — только если Prometheus Operator уже развёрнут.
