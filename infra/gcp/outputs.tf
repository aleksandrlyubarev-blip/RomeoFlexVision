output "testbed_instance_name" {
  description = "Имя VM-инстанса полигона."
  value       = module.gpu_testbed.instance_name
}

output "testbed_external_ip" {
  description = "Эфемерный внешний IP полигона."
  value       = module.gpu_testbed.external_ip
}

output "testbed_ssh_command" {
  description = "Готовая IAP-SSH команда."
  value       = module.gpu_testbed.ssh_command
}

output "testbed_langgraph_url" {
  description = "URL LangGraph-супервайзера на полигоне."
  value       = module.gpu_testbed.langgraph_url
}

output "testbed_sglang_primary_url" {
  description = "URL основного SGLang-эндпоинта (Qwen)."
  value       = module.gpu_testbed.sglang_primary_url
}

output "testbed_models_bucket" {
  description = "Имя GCS-бакета с моделями полигона."
  value       = module.models_bucket.bucket_name
}

output "testbed_registry_repo_url" {
  description = "Полный URL Artifact Registry-репозитория полигона."
  value       = module.models_bucket.registry_repo_url
}
