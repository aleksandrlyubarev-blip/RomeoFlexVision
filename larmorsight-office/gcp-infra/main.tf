locals {
  skills_bucket = var.skills_bucket != "" ? var.skills_bucket : "${var.project_id}-larmorsight-skills"

  required_apis = [
    "run.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudscheduler.googleapis.com",
  ]
}

resource "google_project_service" "enabled" {
  for_each = toset(local.required_apis)

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

# Бакет с навыками сотрудников (SKILL.md, references/, global-instructions.md).
# Наполняется скриптом deploy-to-gcp.sh / командой /sync-with-gcp.
resource "google_storage_bucket" "skills" {
  name                        = local.skills_bucket
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = false

  versioning {
    enabled = true
  }

  depends_on = [google_project_service.enabled]
}

# Секрет с Anthropic API key для облачных копий сотрудников.
resource "google_secret_manager_secret" "anthropic_api_key" {
  secret_id = "larmorsight-anthropic-api-key"

  replication {
    auto {}
  }

  depends_on = [google_project_service.enabled]
}

# Версия секрета создаётся только если ключ передан через переменную.
# Иначе заведите версию вручную: gcloud secrets versions add larmorsight-anthropic-api-key --data-file=-
resource "google_secret_manager_secret_version" "anthropic_api_key" {
  count = var.anthropic_api_key != "" ? 1 : 0

  secret      = google_secret_manager_secret.anthropic_api_key.id
  secret_data = var.anthropic_api_key
}

# Один Cloud Run-сервис на сотрудника из active_employees.
module "ai_employee" {
  for_each = toset(var.active_employees)
  source   = "./modules/ai-employee"

  name                  = each.value
  project_id            = var.project_id
  region                = var.region
  image                 = var.employee_image
  skills_bucket         = google_storage_bucket.skills.name
  api_key_secret_id     = google_secret_manager_secret.anthropic_api_key.secret_id
  allow_unauthenticated = var.allow_unauthenticated
  cpu                   = var.employee_cpu
  memory                = var.employee_memory
  max_instances         = var.employee_max_instances

  depends_on = [google_project_service.enabled]
}

# Опционально: периодический "пинг"/запуск сотрудников по расписанию (skeleton).
resource "google_cloud_scheduler_job" "employee_ping" {
  for_each = var.enable_scheduler ? toset(var.active_employees) : toset([])

  name      = "larmorsight-${each.value}-ping"
  region    = var.region
  schedule  = var.schedule_cron
  time_zone = "Etc/UTC"

  http_target {
    http_method = "POST"
    uri         = "${module.ai_employee[each.value].url}/run"

    oidc_token {
      service_account_email = module.ai_employee[each.value].service_account_email
      audience              = module.ai_employee[each.value].url
    }
  }

  depends_on = [google_project_service.enabled]
}
