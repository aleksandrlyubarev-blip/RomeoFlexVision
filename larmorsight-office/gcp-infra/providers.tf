terraform {
  required_version = ">= 1.9"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0, < 7.0"
    }
  }

  # State в GCS (опционально). По шагам:
  #   1. cd bootstrap && cp terraform.tfvars.example terraform.tfvars && terraform init && terraform apply
  #   2. раскомментируйте блок ниже и подставьте имя бакета (output bootstrap.state_bucket)
  #   3. cd .. && terraform init -migrate-state
  # backend "gcs" {
  #   bucket = "<project_id>-larmorsight-tfstate"
  #   prefix = "larmorsight-office"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
