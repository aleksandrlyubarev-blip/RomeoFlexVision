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
