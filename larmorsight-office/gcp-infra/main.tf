locals {
  skills_bucket = var.skills_bucket != "" ? var.skills_bucket : "${var.project_id}-larmorsight-skills"

  required_apis = [
    "run.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudscheduler.googleapis.com",
    "billingbudgets.googleapis.com",
  ]
}

data "google_project" "this" {
  project_id = var.project_id
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
  invoker_members       = var.invoker_members
  cpu                   = var.employee_cpu
  memory                = var.employee_memory
  max_instances         = var.employee_max_instances

  depends_on = [google_project_service.enabled]
}

# Опционально: бюджетный алерт по проекту (нужен billing_account и права billing.budgets.*).
resource "google_billing_budget" "larmorsight" {
  count = var.billing_account != "" ? 1 : 0

  billing_account = var.billing_account
  display_name    = "LarmorSight AI Office"

  budget_filter {
    projects = ["projects/${data.google_project.this.number}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = tostring(var.budget_amount_usd)
    }
  }

  threshold_rules {
    threshold_percent = 0.5
  }
  threshold_rules {
    threshold_percent = 0.9
  }
  threshold_rules {
    threshold_percent = 1.0
  }

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

# Опционально: репозиторий Artifact Registry для образа рантайма сотрудника.
resource "google_artifact_registry_repository" "larmorsight" {
  count = var.create_artifact_repo ? 1 : 0

  repository_id = var.artifact_repo
  location      = var.region
  format        = "DOCKER"
  description   = "LarmorSight AI employee runtime images"

  depends_on = [google_project_service.enabled]
}

# Опционально: Cloud Build trigger — авто-сборка образа сотрудника при push в GitHub.
# Требует, чтобы репозиторий был подключён к Cloud Build (GitHub App) в консоли GCP.
resource "google_cloudbuild_trigger" "employee_image" {
  count = var.enable_build_trigger ? 1 : 0

  name        = "larmorsight-employee-image"
  description = "LarmorSight: build & push the AI-employee runtime image on push"
  project     = var.project_id

  github {
    owner = var.github_owner
    name  = var.github_repo
    push {
      branch = "^${var.build_branch}$"
    }
  }

  # Запускать только при изменении рантайма / конфига сборки.
  included_files = [
    "larmorsight-office/gcp-infra/employee-runtime/**",
    "larmorsight-office/gcp-infra/cloudbuild.yaml",
  ]

  filename = "larmorsight-office/gcp-infra/cloudbuild.yaml"

  substitutions = {
    _REGION     = var.region
    _REPO       = var.artifact_repo
    _IMAGE      = "larmorsight-employee"
    _TAG        = "latest"
    _SOURCE_DIR = "larmorsight-office/gcp-infra/employee-runtime"
  }

  depends_on = [google_project_service.enabled]
}
