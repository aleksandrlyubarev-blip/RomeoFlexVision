resource "google_storage_bucket" "models" {
  name                        = var.name
  project                     = var.project_id
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  force_destroy               = false

  versioning { enabled = false }

  lifecycle_rule {
    condition { age = 30 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition { age = 180 }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  labels = var.labels
}

resource "google_artifact_registry_repository" "roboqc" {
  project       = var.project_id
  location      = var.region
  repository_id = var.registry_repo_id
  format        = "DOCKER"
  description   = "RoboQC testbed images: sglang sidecars, rhaef-supervisor, bench harness."
  labels        = var.labels
}
