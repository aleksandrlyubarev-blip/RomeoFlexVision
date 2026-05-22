terraform {
  required_version = ">= 1.9"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0, < 7.0"
    }
  }

  # При желании вынесите state в GCS:
  # backend "gcs" {
  #   bucket = "<project_id>-roboqc-tfstate"
  #   prefix = "roboqc-testbed"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.testbed_region
}
