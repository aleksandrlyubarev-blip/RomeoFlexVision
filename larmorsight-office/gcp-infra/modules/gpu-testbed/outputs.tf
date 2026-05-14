output "instance_name" {
  description = "Имя VM-инстанса полигона."
  value       = google_compute_instance.testbed.name
}

output "zone" {
  description = "Зона, где живёт инстанс."
  value       = google_compute_instance.testbed.zone
}

output "external_ip" {
  description = "Эфемерный внешний IP инстанса (если access_config включён)."
  value       = try(google_compute_instance.testbed.network_interface[0].access_config[0].nat_ip, null)
}

output "service_account_email" {
  description = "Сервис-аккаунт VM полигона."
  value       = google_service_account.testbed.email
}

output "ssh_command" {
  description = "Готовая команда для IAP-SSH к полигону."
  value       = "gcloud compute ssh ${google_compute_instance.testbed.name} --zone=${google_compute_instance.testbed.zone} --project=${var.project_id} --tunnel-through-iap"
}

output "langgraph_url" {
  description = "URL LangGraph-супервайзера (если открыт внешний доступ)."
  value       = try("http://${google_compute_instance.testbed.network_interface[0].access_config[0].nat_ip}:8000", null)
}

output "sglang_primary_url" {
  description = "URL основного SGLang-эндпоинта (Qwen)."
  value       = try("http://${google_compute_instance.testbed.network_interface[0].access_config[0].nat_ip}:30000/v1", null)
}
