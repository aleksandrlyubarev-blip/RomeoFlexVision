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

# --- RoboQC GPU testbed outputs ------------------------------------------
output "testbed_instance_name" {
  description = "Имя VM-инстанса полигона (null если enable_testbed = false)."
  value       = try(module.gpu_testbed[0].instance_name, null)
}

output "testbed_external_ip" {
  description = "Эфемерный внешний IP полигона."
  value       = try(module.gpu_testbed[0].external_ip, null)
}

output "testbed_ssh_command" {
  description = "Готовая IAP-SSH команда."
  value       = try(module.gpu_testbed[0].ssh_command, null)
}

output "testbed_langgraph_url" {
  description = "URL LangGraph-супервайзера на полигоне."
  value       = try(module.gpu_testbed[0].langgraph_url, null)
}

output "testbed_sglang_primary_url" {
  description = "URL основного SGLang-эндпоинта (Qwen)."
  value       = try(module.gpu_testbed[0].sglang_primary_url, null)
}

output "testbed_models_bucket" {
  description = "Имя GCS-бакета с моделями полигона."
  value       = try(module.models_bucket[0].bucket_name, null)
}

output "testbed_registry_repo_url" {
  description = "Полный URL Artifact Registry-репозитория полигона."
  value       = try(module.models_bucket[0].registry_repo_url, null)
}
