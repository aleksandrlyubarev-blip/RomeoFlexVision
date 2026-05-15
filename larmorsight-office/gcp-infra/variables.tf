variable "project_id" {
  type        = string
  description = "GCP project ID, в котором разворачиваются AI-сотрудники LarmorSight."
}

variable "region" {
  type        = string
  description = "Регион GCP для Cloud Run / Cloud Scheduler / бакета навыков."
  default     = "us-central1"
}

variable "active_employees" {
  type        = list(string)
  description = "Имена AI-сотрудников (папки в larmorsight-office/employees/), которых разворачиваем в Cloud Run."
  default     = []
}

variable "employee_image" {
  type        = string
  description = <<-EOT
    Docker-образ рантайма сотрудника, например:
    REGION-docker.pkg.dev/PROJECT/REPO/larmorsight-employee:TAG.
    Соберите из gcp-infra/employee-runtime/Dockerfile и запушьте в Artifact Registry.
    По умолчанию — публичный hello-образ Cloud Run (плейсхолдер).
  EOT
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "skills_bucket" {
  type        = string
  description = "Имя бакета Cloud Storage с навыками сотрудников. Пусто => '<project_id>-larmorsight-skills'."
  default     = ""
}

variable "anthropic_api_key" {
  type        = string
  description = "Anthropic API key для сотрудников. Можно оставить пустым и завести версию секрета вручную / из CI."
  default     = ""
  sensitive   = true
}

variable "allow_unauthenticated" {
  type        = bool
  description = "Разрешить публичный (неаутентифицированный) доступ к Cloud Run-сервисам сотрудников."
  default     = false
}

variable "invoker_members" {
  type        = list(string)
  description = <<-EOT
    IAM-принципалы, которым выдаётся roles/run.invoker на сервисы сотрудников
    (M2M-вызовы /run через OIDC). Например:
    ["serviceAccount:caller@PROJECT.iam.gserviceaccount.com", "user:me@example.com"].
    Cloud Scheduler уже получает доступ через OIDC сервис-аккаунта сотрудника.
  EOT
  default     = []
}

variable "billing_account" {
  type        = string
  description = "ID биллинг-аккаунта (например \"012345-6789AB-CDEF01\") для бюджетного алерта. Пусто => бюджет не создаётся."
  default     = ""
}

variable "budget_amount_usd" {
  type        = number
  description = "Месячный бюджет в USD для алерта (если billing_account задан)."
  default     = 50
}

variable "employee_cpu" {
  type        = string
  description = "Лимит CPU для контейнера сотрудника."
  default     = "1"
}

variable "employee_memory" {
  type        = string
  description = "Лимит памяти для контейнера сотрудника."
  default     = "512Mi"
}

variable "employee_max_instances" {
  type        = number
  description = "Максимум инстансов Cloud Run на сотрудника (контроль расходов)."
  default     = 3
}

variable "enable_scheduler" {
  type        = bool
  description = "Создавать Cloud Scheduler-задачи для периодического запуска сотрудников (skeleton)."
  default     = false
}

variable "schedule_cron" {
  type        = string
  description = "Cron-расписание периодического запуска (если enable_scheduler = true)."
  default     = "0 9 * * 1"
}

variable "artifact_repo" {
  type        = string
  description = "Имя репозитория Artifact Registry (Docker), куда публикуется образ рантайма сотрудника."
  default     = "larmorsight"
}

variable "create_artifact_repo" {
  type        = bool
  description = "Создавать репозиторий Artifact Registry силами Terraform (иначе создайте его вручную: gcloud artifacts repositories create)."
  default     = false
}

variable "enable_build_trigger" {
  type        = bool
  description = <<-EOT
    Создавать Cloud Build trigger для авто-сборки образа сотрудника при push в GitHub
    (использует gcp-infra/cloudbuild.yaml). Требует, чтобы репозиторий был ПОДКЛЮЧЁН
    к Cloud Build (GitHub App) — это разовый шаг в консоли GCP, в Terraform для
    1st-gen триггеров его сделать нельзя.
  EOT
  default     = false
}

variable "github_owner" {
  type        = string
  description = "Владелец GitHub-репозитория для Cloud Build trigger."
  default     = "aleksandrlyubarev-blip"
}

variable "github_repo" {
  type        = string
  description = "Имя GitHub-репозитория для Cloud Build trigger."
  default     = "RomeoFlexVision"
}

variable "build_branch" {
  type        = string
  description = "Ветка, push в которую запускает сборку образа сотрудника."
  default     = "main"
}

variable "enable_alerts" {
  type        = bool
  description = "Создавать алерты Cloud Monitoring на ошибки и латентность сервисов сотрудников."
  default     = false
}

variable "alert_email" {
  type        = string
  description = "Email для уведомлений (создаётся google_monitoring_notification_channel). Пусто => канал не создаётся; алерты сработают, но без уведомления по email."
  default     = ""
}

variable "alert_latency_threshold_ms" {
  type        = number
  description = "Порог p95-латентности /run (мс), при превышении которого срабатывает алерт."
  default     = 30000
}

variable "enable_dashboard" {
  type        = bool
  description = "Создавать дашборд Cloud Monitoring «LarmorSight AI Office — Overview» (request rate + p95-латентность на каждого сотрудника)."
  default     = false
}
