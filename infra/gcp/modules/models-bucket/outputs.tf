output "bucket_name" {
  description = "Имя GCS-бакета с моделями."
  value       = google_storage_bucket.models.name
}

output "bucket_url" {
  description = "gs://-URL бакета."
  value       = "gs://${google_storage_bucket.models.name}"
}

output "registry_repo_url" {
  description = "Полный URL Artifact Registry-репозитория."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.roboqc.repository_id}"
}
