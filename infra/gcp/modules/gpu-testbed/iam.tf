# Сервис-аккаунт самого VM-инстанса полигона.
resource "google_service_account" "testbed" {
  account_id   = "${var.name}-vm"
  display_name = "RoboQC testbed VM SA (${var.name})"
  project      = var.project_id
}

resource "google_project_iam_member" "testbed_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.testbed.email}"
}

resource "google_project_iam_member" "testbed_monitoring" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.testbed.email}"
}

resource "google_project_iam_member" "testbed_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.testbed.email}"
}

resource "google_storage_bucket_iam_member" "testbed_models_reader" {
  bucket = var.models_bucket
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.testbed.email}"
}

resource "google_project_iam_member" "testbed_artifact_reader" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.testbed.email}"
}

# Отдельный SA для Cloud Scheduler (старт/стоп инстанса).
resource "google_service_account" "scheduler" {
  account_id   = "${var.name}-sched"
  display_name = "RoboQC testbed scheduler SA (${var.name})"
  project      = var.project_id
}

resource "google_project_iam_member" "scheduler_compute_admin" {
  project = var.project_id
  role    = "roles/compute.instanceAdmin.v1"
  member  = "serviceAccount:${google_service_account.scheduler.email}"
  condition {
    title      = "only-testbed-vm"
    expression = "resource.name == 'projects/${var.project_id}/zones/${var.zone}/instances/${var.name}'"
  }
}
