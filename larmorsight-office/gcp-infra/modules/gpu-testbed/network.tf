# Firewall: SGLang (30000-30010) и LangGraph API (8000) — только из allowed_cidrs.
resource "google_compute_firewall" "sglang" {
  name    = "${var.name}-sglang"
  project = var.project_id
  network = "default"

  description   = "SGLang OpenAI-compatible endpoints для полигона RoboQC."
  source_ranges = var.allowed_cidrs
  target_tags   = ["roboqc-testbed"]

  allow {
    protocol = "tcp"
    ports    = ["30000-30010"]
  }
}

resource "google_compute_firewall" "langgraph" {
  name    = "${var.name}-langgraph"
  project = var.project_id
  network = "default"

  description   = "LangGraph supervisor (rhaef-supervisor) FastAPI :8000."
  source_ranges = var.allowed_cidrs
  target_tags   = ["roboqc-testbed"]

  allow {
    protocol = "tcp"
    ports    = ["8000"]
  }
}

# IAP SSH (35.235.240.0/20) разрешён по умолчанию через allowed_cidrs.
resource "google_compute_firewall" "iap_ssh" {
  name    = "${var.name}-iap-ssh"
  project = var.project_id
  network = "default"

  description   = "IAP TCP forwarding (SSH через gcloud compute ssh --tunnel-through-iap)."
  source_ranges = ["35.235.240.0/20"]
  target_tags   = ["roboqc-testbed"]

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}
