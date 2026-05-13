output "skills_bucket" {
  description = "Имя бакета Cloud Storage с навыками сотрудников."
  value       = google_storage_bucket.skills.name
}

output "anthropic_api_key_secret" {
  description = "ID секрета в Secret Manager с Anthropic API key."
  value       = google_secret_manager_secret.anthropic_api_key.secret_id
}

output "active_employees" {
  description = "Список развёрнутых AI-сотрудников."
  value       = var.active_employees
}

output "employee_urls" {
  description = "URL Cloud Run-сервисов по имени сотрудника."
  value       = { for name, mod in module.ai_employee : name => mod.url }
}

output "employee_service_accounts" {
  description = "Сервисные аккаунты сотрудников по имени."
  value       = { for name, mod in module.ai_employee : name => mod.service_account_email }
}

output "artifact_repo" {
  description = "Имя репозитория Artifact Registry для образа сотрудника (null, если не управляется Terraform)."
  value       = one(google_artifact_registry_repository.larmorsight[*].repository_id)
}

output "build_trigger_id" {
  description = "ID Cloud Build trigger для образа сотрудника (null, если enable_build_trigger = false)."
  value       = one(google_cloudbuild_trigger.employee_image[*].trigger_id)
}
