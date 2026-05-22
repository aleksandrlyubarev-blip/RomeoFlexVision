variable "project_id" {
  type        = string
  description = "GCP project ID, в котором разворачивается GPU-полигон RoboQC."
}

variable "testbed_region" {
  type        = string
  description = "Регион полигона (GPU-инстанс, бакет моделей, Artifact Registry)."
  default     = "europe-west4"
}

variable "testbed_zone" {
  type        = string
  description = "Зона GPU-инстанса. A2-ultragpu доступен в europe-west4-a/b."
  default     = "europe-west4-b"
}

variable "gpu_machine_type" {
  type        = string
  description = "a2-ultragpu-1g (1x A100 80GB) или a2-highgpu-1g (1x A100 40GB)."
  default     = "a2-ultragpu-1g"
}

variable "gpu_accelerator_type" {
  type        = string
  description = "nvidia-a100-80gb для a2-ultragpu, nvidia-tesla-a100 для a2-highgpu."
  default     = "nvidia-a100-80gb"
}

variable "gpu_accelerator_count" {
  type        = number
  description = "Кол-во GPU на инстансе."
  default     = 1
}

variable "use_spot" {
  type        = bool
  description = "Spot VM (~70% дешевле, может быть preempted). Рекомендуется для полигона."
  default     = true
}

variable "models_bucket_name" {
  type        = string
  description = "Имя GCS-бакета моделей. Пусто => '<project_id>-roboqc-models'."
  default     = ""
}

variable "testbed_registry_repo_id" {
  type        = string
  description = "Имя Artifact Registry-репозитория полигона."
  default     = "roboqc"
}

variable "testbed_allowed_cidrs" {
  type        = list(string)
  description = "CIDR-блоки, которым открыты порты 8000/30000-30010. По умолчанию — IAP TCP forwarding."
  default     = ["35.235.240.0/20"]
}

variable "testbed_monthly_budget_usd" {
  type        = number
  description = "Ориентировочный месячный бюджет полигона. Используется в алерте простоя GPU."
  default     = 2500
}

variable "testbed_auto_shutdown_cron" {
  type        = string
  description = "Cron авто-стопа VM (UTC). Пусто => не создавать."
  default     = "0 19 * * *"
}

variable "testbed_auto_start_cron" {
  type        = string
  description = "Cron авто-старта VM (UTC). Пусто => не создавать."
  default     = "0 7 * * 1-5"
}

variable "testbed_primary_model_repo_id" {
  type        = string
  description = "HuggingFace repo id основной модели."
  default     = "Qwen/Qwen3.6-35B-A3B-FP8"
}

variable "testbed_secondary_model_repo_id" {
  type        = string
  description = "HuggingFace repo id альтернативной модели."
  default     = "google/gemma-4-31b"
}

variable "testbed_vision_model_repo_id" {
  type        = string
  description = "HuggingFace repo id vision-модели."
  default     = "Qwen/Qwen3-VL-8B-Instruct"
}

variable "testbed_compose_ref" {
  type        = string
  description = "Git-ref репозитория, который тянет полигон для compose.gpu.yml."
  default     = "claude/gcp-roboqc-testbed-Khbl8"
}

variable "testbed_compose_repo_url" {
  type        = string
  description = "Git URL репозитория с compose.gpu.yml."
  default     = "https://github.com/aleksandrlyubarev-blip/RomeoFlexVision.git"
}
