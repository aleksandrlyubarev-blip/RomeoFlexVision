variable "project_id" {
  type        = string
  description = "GCP project ID для тестового полигона RoboQC."
}

variable "region" {
  type        = string
  description = "Регион GCP (для бакета моделей и Artifact Registry)."
  default     = "europe-west4"
}

variable "zone" {
  type        = string
  description = "Зона GCP, где поднимается A100-инстанс. A2-ultragpu доступен в europe-west4-a/b."
  default     = "europe-west4-b"
}

variable "name" {
  type        = string
  description = "Базовое имя ресурсов полигона (instance, SA, FW-правил)."
  default     = "roboqc-testbed"
}

variable "machine_type" {
  type        = string
  description = "Тип A2-инстанса. a2-ultragpu-1g => 1x A100 80GB, 12 vCPU, 170 GiB RAM."
  default     = "a2-ultragpu-1g"
}

variable "accelerator_type" {
  type        = string
  description = "Тип GPU. Для a2-ultragpu — nvidia-a100-80gb. Для a2-highgpu — nvidia-tesla-a100 (40GB)."
  default     = "nvidia-a100-80gb"
}

variable "accelerator_count" {
  type        = number
  description = "Кол-во GPU на инстансе. Для тестов оставляйте 1."
  default     = 1
}

variable "use_spot" {
  type        = bool
  description = "Запускать как Spot VM (≈70% дешевле, может быть preempted). Рекомендуется для полигона."
  default     = true
}

variable "boot_disk_image" {
  type        = string
  description = "Образ загрузочного диска. Default — Deep Learning VM (CUDA 12.4 + docker + nvidia-container-toolkit предустановлены)."
  default     = "projects/deeplearning-platform-release/global/images/family/common-cu124-ubuntu-2204-py310"
}

variable "boot_disk_size_gb" {
  type        = number
  description = "Размер загрузочного диска (PD-Balanced)."
  default     = 200
}

variable "local_ssd_count" {
  type        = number
  description = "Количество Local SSD по 375 GB (NVMe) — для кэша GGUF-моделей."
  default     = 1
}

variable "models_bucket" {
  type        = string
  description = "Имя GCS-бакета с моделями (создаётся в модуле models-bucket)."
}

variable "registry_repo" {
  type        = string
  description = "Имя Artifact Registry Docker-репозитория (формат REGION-docker.pkg.dev/PROJECT/REPO)."
}

variable "compose_ref" {
  type        = string
  description = "Git-ref репозитория romeoflexvision, который полигон тянет для compose.gpu.yml."
  default     = "claude/gcp-roboqc-testbed-Khbl8"
}

variable "compose_repo_url" {
  type        = string
  description = "Git URL репозитория с compose.gpu.yml. Поддерживается публичный HTTPS либо gs:// (tarball)."
  default     = "https://github.com/aleksandrlyubarev-blip/RomeoFlexVision.git"
}

variable "allowed_cidrs" {
  type        = list(string)
  description = "CIDR-блоки, которым открыты порты 8000 (LangGraph) и 30000-30010 (SGLang). По умолчанию — только IAP."
  default     = ["35.235.240.0/20"]
}

variable "labels" {
  type        = map(string)
  description = "Лейблы для биллинга/инвентаризации."
  default = {
    component = "roboqc-testbed"
    owner     = "rhaef-v2"
  }
}

variable "monthly_budget_usd" {
  type        = number
  description = "Ориентировочный месячный бюджет полигона (USD). Используется в Cloud Monitoring алерте простоя."
  default     = 2500
}

variable "auto_shutdown_cron" {
  type        = string
  description = "Cron для авто-стопа инстанса в нерабочее время (UTC). Пусто => не создавать Scheduler."
  default     = "0 19 * * *"
}

variable "auto_start_cron" {
  type        = string
  description = "Cron для авто-старта инстанса утром (UTC). Пусто => не создавать Scheduler."
  default     = "0 7 * * 1-5"
}

variable "primary_model_repo_id" {
  type        = string
  description = "HuggingFace repo id основной модели (Qwen 3.6-35B-A3B)."
  default     = "Qwen/Qwen3.6-35B-A3B-FP8"
}

variable "secondary_model_repo_id" {
  type        = string
  description = "HuggingFace repo id альтернативной модели (Gemma 4 31B)."
  default     = "google/gemma-4-31b"
}

variable "vision_model_repo_id" {
  type        = string
  description = "HuggingFace repo id vision-модели."
  default     = "Qwen/Qwen3-VL-8B-Instruct"
}
