# gcp-infra/bootstrap — бакет под Terraform state

Минимальная Terraform-конфигурация, которая создаёт бакет Cloud Storage для
хранения state основной конфигурации (`..`). Свой собственный state она держит
**локально** — это нормально для бакета state (классическая дилемма «курицы и яйца»).

## Когда использовать

Когда вы переходите от локального `terraform.tfstate` (по умолчанию в основной
конфигурации) к state в GCS — это нужно при работе в команде, в CI или просто
для надёжности.

## Как использовать

```bash
cd larmorsight-office/gcp-infra/bootstrap

cp terraform.tfvars.example terraform.tfvars
# project_id, region — те же, что в основном gcp-infra/terraform.tfvars

terraform init
terraform apply
# смотрим вывод — `state_bucket` и `backend_config_snippet`
```

После этого включите backend в `../providers.tf` — раскомментируйте блок
`backend "gcs"` и подставьте имя бакета (или просто скопируйте `backend_config_snippet`
из output). Затем перенесите state основной конфигурации:

```bash
cd ..
terraform init -migrate-state
```

Terraform спросит подтверждение и зальёт текущий локальный state в бакет под
префиксом `larmorsight-office/`. Локальный `terraform.tfstate*` после миграции
можно удалить.

## Что создаётся

- `google_storage_bucket.tfstate` — бакет `<project_id>-larmorsight-tfstate`
  (или ваше имя из `state_bucket`), с включённым versioning и lifecycle-правилом
  на удаление старых архивных версий (после 30 дней и при наличии ≥ 5 более свежих).

State этой папки ведите рядом (`bootstrap/terraform.tfstate*`) и коммитьте только
вместе с осознанным решением — бакет создаётся **один раз**.
