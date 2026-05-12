terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0, < 7.0"
    }
  }
}

locals {
  # имя сотрудника нормализуем для GCP-идентификаторов (a-z, 0-9, '-')
  slug = replace(lower(var.name), "_", "-")

  service_name = "larmorsight-${local.slug}"

  # account_id сервис-аккаунта: 6-30 символов, поэтому держите имя сотрудника
  # в пределах ~3-27 символов из [a-z0-9-].
  sa_account_id = "ls-${local.slug}"
}

resource "google_service_account" "employee" {
  project      = var.project_id
  account_id   = local.sa_account_id
  display_name = "LarmorSight employee: ${var.name}"
}

# Навыки сотрудника лежат в Cloud Storage — даём сервис-аккаунту read-only доступ.
resource "google_storage_bucket_iam_member" "skills_reader" {
  bucket = var.skills_bucket
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.employee.email}"
}

# Доступ к секрету с Anthropic API key.
resource "google_secret_manager_secret_iam_member" "api_key_accessor" {
  project   = var.project_id
  secret_id = var.api_key_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.employee.email}"
}

resource "google_cloud_run_v2_service" "employee" {
  name     = local.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.employee.email

    scaling {
      min_instance_count = 0
      max_instance_count = var.max_instances
    }

    containers {
      image = var.image

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
      }

      env {
        name  = "LARMORSIGHT_EMPLOYEE"
        value = var.name
      }
      env {
        name  = "LARMORSIGHT_SKILLS_BUCKET"
        value = var.skills_bucket
      }
      env {
        name  = "LARMORSIGHT_SKILL_PATH"
        value = "employees/${var.name}/SKILL.md"
      }
      env {
        name = "ANTHROPIC_API_KEY"
        value_source {
          secret_key_ref {
            secret  = var.api_key_secret_id
            version = "latest"
          }
        }
      }
    }
  }

  depends_on = [
    google_secret_manager_secret_iam_member.api_key_accessor,
    google_storage_bucket_iam_member.skills_reader,
  ]
}

# Публичный доступ — только если явно разрешён.
resource "google_cloud_run_v2_service_iam_member" "invoker" {
  count = var.allow_unauthenticated ? 1 : 0

  project  = var.project_id
  location = google_cloud_run_v2_service.employee.location
  name     = google_cloud_run_v2_service.employee.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Явно перечисленные принципалы могут вызывать сервис (M2M через OIDC).
resource "google_cloud_run_v2_service_iam_member" "invokers" {
  for_each = toset(var.invoker_members)

  project  = var.project_id
  location = google_cloud_run_v2_service.employee.location
  name     = google_cloud_run_v2_service.employee.name
  role     = "roles/run.invoker"
  member   = each.value
}
