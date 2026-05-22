locals {
  startup_script = templatefile("${path.module}/startup.sh.tftpl", {
    compose_repo_url        = var.compose_repo_url
    compose_ref             = var.compose_ref
    models_bucket           = var.models_bucket
    registry_repo           = var.registry_repo
    region                  = var.region
    primary_model_repo_id   = var.primary_model_repo_id
    secondary_model_repo_id = var.secondary_model_repo_id
    vision_model_repo_id    = var.vision_model_repo_id
  })
}

resource "google_compute_instance" "testbed" {
  name           = var.name
  machine_type   = var.machine_type
  zone           = var.zone
  project        = var.project_id
  labels         = var.labels
  tags           = ["roboqc-testbed"]
  can_ip_forward = false

  scheduling {
    on_host_maintenance = "TERMINATE"
    preemptible         = var.use_spot
    automatic_restart   = !var.use_spot
    provisioning_model  = var.use_spot ? "SPOT" : "STANDARD"
    instance_termination_action = var.use_spot ? "STOP" : null
  }

  guest_accelerator {
    type  = var.accelerator_type
    count = var.accelerator_count
  }

  boot_disk {
    initialize_params {
      image = var.boot_disk_image
      size  = var.boot_disk_size_gb
      type  = "pd-balanced"
    }
  }

  dynamic "scratch_disk" {
    for_each = range(var.local_ssd_count)
    content {
      interface = "NVME"
    }
  }

  network_interface {
    network = "default"
    access_config {} # эфемерный внешний IP — снимите для приватной сети
  }

  service_account {
    email  = google_service_account.testbed.email
    scopes = ["cloud-platform"]
  }

  metadata = {
    enable-oslogin         = "TRUE"
    install-nvidia-driver  = "True"
    google-monitoring-enabled = "true"
    google-logging-enabled    = "true"
    startup-script         = local.startup_script
  }

  # Spot-инстанс может переходить в STOPPED после preemption — это ожидаемо.
  lifecycle {
    ignore_changes = [
      metadata["ssh-keys"],
    ]
  }
}

# Cloud Monitoring dashboard (GPU util / VRAM / SGLang tokens/s).
resource "google_monitoring_dashboard" "testbed" {
  project        = var.project_id
  dashboard_json = file("${path.module}/dashboard.json")
}

# Алерт: GPU простаивает дольше 30 минут — деньги горят.
resource "google_monitoring_alert_policy" "idle_gpu" {
  project      = var.project_id
  display_name = "${var.name}: GPU idle > 30m"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "agent.googleapis.com/gpu/utilization == 0 for 30m"
    condition_threshold {
      filter          = "resource.type=\"gce_instance\" AND metric.type=\"agent.googleapis.com/gpu/utilization\" AND resource.labels.instance_id=\"${google_compute_instance.testbed.instance_id}\""
      duration        = "1800s"
      comparison      = "COMPARISON_LT"
      threshold_value = 1
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  documentation {
    content   = "A100 простаивает >30 минут — рассмотрите стоп инстанса (`gcloud compute instances stop ${var.name} --zone=${var.zone}`). Месячный бюджет: $${var.monthly_budget_usd}."
    mime_type = "text/markdown"
  }
}

# Cloud Scheduler: авто-стоп вечером (gated по var.auto_shutdown_cron).
resource "google_cloud_scheduler_job" "auto_shutdown" {
  count       = var.auto_shutdown_cron != "" ? 1 : 0
  project     = var.project_id
  region      = var.region
  name        = "${var.name}-auto-shutdown"
  description = "Останавливает GPU-полигон в нерабочее время для экономии."
  schedule    = var.auto_shutdown_cron
  time_zone   = "Etc/UTC"

  http_target {
    http_method = "POST"
    uri         = "https://compute.googleapis.com/compute/v1/projects/${var.project_id}/zones/${var.zone}/instances/${google_compute_instance.testbed.name}/stop"
    oauth_token {
      service_account_email = google_service_account.scheduler.email
      scope                 = "https://www.googleapis.com/auth/cloud-platform"
    }
  }
}

resource "google_cloud_scheduler_job" "auto_start" {
  count       = var.auto_start_cron != "" ? 1 : 0
  project     = var.project_id
  region      = var.region
  name        = "${var.name}-auto-start"
  description = "Стартует GPU-полигон в рабочее время. Только пн-пт по умолчанию."
  schedule    = var.auto_start_cron
  time_zone   = "Etc/UTC"

  http_target {
    http_method = "POST"
    uri         = "https://compute.googleapis.com/compute/v1/projects/${var.project_id}/zones/${var.zone}/instances/${google_compute_instance.testbed.name}/start"
    oauth_token {
      service_account_email = google_service_account.scheduler.email
      scope                 = "https://www.googleapis.com/auth/cloud-platform"
    }
  }
}
