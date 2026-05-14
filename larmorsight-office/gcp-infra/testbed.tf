# RoboQC GPU testbed: подключается опционально через var.enable_testbed.
# Когда enable_testbed = false (по умолчанию) — никакого diff'а нет, существующая
# инфраструктура AI-сотрудников (Cloud Run) не затрагивается.

module "models_bucket" {
  count  = var.enable_testbed ? 1 : 0
  source = "./modules/models-bucket"

  project_id       = var.project_id
  region           = var.testbed_region
  name             = var.models_bucket_name != "" ? var.models_bucket_name : "${var.project_id}-roboqc-models"
  registry_repo_id = var.testbed_registry_repo_id

  depends_on = [google_project_service.enabled]
}

module "gpu_testbed" {
  count  = var.enable_testbed ? 1 : 0
  source = "./modules/gpu-testbed"

  project_id              = var.project_id
  region                  = var.testbed_region
  zone                    = var.testbed_zone
  machine_type            = var.gpu_machine_type
  accelerator_type        = var.gpu_accelerator_type
  accelerator_count       = var.gpu_accelerator_count
  use_spot                = var.use_spot
  models_bucket           = module.models_bucket[0].bucket_name
  registry_repo           = module.models_bucket[0].registry_repo_url
  allowed_cidrs           = var.testbed_allowed_cidrs
  monthly_budget_usd      = var.testbed_monthly_budget_usd
  auto_shutdown_cron      = var.testbed_auto_shutdown_cron
  auto_start_cron         = var.testbed_auto_start_cron
  primary_model_repo_id   = var.testbed_primary_model_repo_id
  secondary_model_repo_id = var.testbed_secondary_model_repo_id
  vision_model_repo_id    = var.testbed_vision_model_repo_id
  compose_ref             = var.testbed_compose_ref
  compose_repo_url        = var.testbed_compose_repo_url

  depends_on = [google_project_service.enabled]
}
