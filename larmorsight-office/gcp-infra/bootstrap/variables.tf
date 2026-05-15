variable "project_id" {
  type        = string
  description = "GCP project ID, в котором создаётся бакет для Terraform state."
}

variable "region" {
  type        = string
  description = "Регион (location) для бакета state."
  default     = "us-central1"
}

variable "state_bucket" {
  type        = string
  description = "Имя бакета для Terraform state. Пусто => '<project_id>-larmorsight-tfstate'."
  default     = ""
}
