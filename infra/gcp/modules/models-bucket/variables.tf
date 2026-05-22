variable "project_id" {
  type        = string
  description = "GCP project ID."
}

variable "region" {
  type        = string
  description = "Регион бакета и Artifact Registry."
  default     = "europe-west4"
}

variable "name" {
  type        = string
  description = "Имя GCS-бакета для моделей. Должно быть глобально уникальным."
}

variable "registry_repo_id" {
  type        = string
  description = "Repository ID Artifact Registry (без префикса location)."
  default     = "roboqc"
}

variable "labels" {
  type        = map(string)
  description = "Лейблы для биллинга."
  default = {
    component = "roboqc-testbed"
  }
}
