variable "name" {
  type        = string
  description = "Имя сотрудника (папка в larmorsight-office/employees/)."
}

variable "project_id" {
  type        = string
  description = "GCP project ID."
}

variable "region" {
  type        = string
  description = "Регион Cloud Run."
}

variable "image" {
  type        = string
  description = "Docker-образ рантайма сотрудника."
}

variable "skills_bucket" {
  type        = string
  description = "Имя бакета Cloud Storage с навыками."
}

variable "api_key_secret_id" {
  type        = string
  description = "Secret ID в Secret Manager с Anthropic API key."
}

variable "allow_unauthenticated" {
  type        = bool
  description = "Разрешить публичный доступ к сервису."
  default     = false
}

variable "invoker_members" {
  type        = list(string)
  description = "IAM-принципалы, которым выдаётся roles/run.invoker на этот сервис."
  default     = []
}

variable "cpu" {
  type        = string
  description = "Лимит CPU."
  default     = "1"
}

variable "memory" {
  type        = string
  description = "Лимит памяти."
  default     = "512Mi"
}

variable "max_instances" {
  type        = number
  description = "Максимум инстансов Cloud Run."
  default     = 3
}
