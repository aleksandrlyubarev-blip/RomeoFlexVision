output "state_bucket" {
  description = "Имя созданного бакета для Terraform state."
  value       = google_storage_bucket.tfstate.name
}

output "backend_config_snippet" {
  description = "Готовый блок backend для providers.tf основной конфигурации."
  value       = <<-EOT
    backend "gcs" {
      bucket = "${google_storage_bucket.tfstate.name}"
      prefix = "larmorsight-office"
    }
  EOT
}
