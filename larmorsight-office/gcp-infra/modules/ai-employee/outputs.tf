output "url" {
  description = "URL Cloud Run-сервиса сотрудника."
  value       = google_cloud_run_v2_service.employee.uri
}

output "service_name" {
  description = "Имя Cloud Run-сервиса."
  value       = google_cloud_run_v2_service.employee.name
}

output "service_account_email" {
  description = "Email сервис-аккаунта сотрудника."
  value       = google_service_account.employee.email
}
