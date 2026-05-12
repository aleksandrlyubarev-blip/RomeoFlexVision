# LarmorSight AI Office

Цифровой офис LarmorSight для Claude Code / Claude Cowork: набор AI-сотрудников
(плагины с навыками), общие slash-команды, единый брендбук и инструменты
развёртывания тех же сотрудников в облаке Google Cloud Platform по требованию.

> Статус: **v0.1 — локальный офис + GCP-скелет.** Терраформ-инфраструктура
> валидна, но рассчитана на ваш реальный GCP-проект и собранный образ
> контейнера — `terraform apply` и сборка образа в этот пакет не входят.

## Что внутри

```
larmorsight-office/
├── .claude-plugin/plugin.json   # манифест плагина
├── global-instructions.md       # тон и стандарты для всех сотрудников
├── folder-instructions.md       # что и куда складывать
├── deploy-to-gcp.sh             # развернуть одного сотрудника в GCP (скелет)
├── commands/                    # офисные slash-команды
├── employees/                   # AI-сотрудники (по папке на роль)
│   ├── research-analyst/
│   ├── content-strategist/
│   ├── sales-operator/
│   ├── devops-engineer/
│   ├── finance-reviewer/
│   └── custom/                  # шаблон для ваших собственных сотрудников
├── references/                  # брендбук, шаблоны, описание компании
├── workspace/                   # активные и архивные рабочие задачи
└── gcp-infra/                   # Terraform: Cloud Run + Cloud Storage + Secret Manager
```

## Быстрый старт (локально)

1. **Подключить офис как плагин.** Из Claude Code:
   ```
   /plugin marketplace add ./larmorsight-office
   /plugin install larmorsight-office
   ```
   (либо добавьте каталог `larmorsight-office/` в свой проектный плагин-маркетплейс —
   см. документацию Claude Code по плагинам.)
2. **Посмотреть сотрудников:** `/list-employees`
3. **Активировать сотрудника:** упомяните его в задаче — навык `employees/<role>/SKILL.md`
   подскажет Claude роль, чек-листы и ссылки на шаблоны.
4. **Новый сотрудник:** `/new-employee <name>` — создаёт скелет в `employees/custom/<name>/`
   из `employees/custom/TEMPLATE.md`.

## Быстрый старт (облако, GCP)

Подробности — в [`gcp-infra/README.md`](gcp-infra/README.md). Кратко:

```bash
cd larmorsight-office/gcp-infra
cp terraform.tfvars.example terraform.tfvars   # заполнить project_id, region, image
terraform init
terraform plan

# Развернуть конкретного сотрудника в Cloud Run:
cd ..
./deploy-to-gcp.sh research-analyst
```

В Claude Code то же самое: `/deploy-to-gcp research-analyst`, `/sync-with-gcp`.

## Принципы

- **Модульность.** Один сотрудник = одна самодостаточная папка в `employees/`.
- **Качество через чек-листы.** В каждом `SKILL.md` есть конкретный чек-лист
  «готово/не готово».
- **Performance review.** Регулярная оценка сотрудников по
  [`references/templates/performance-review.md`](references/templates/performance-review.md).
- **Friction в критичных местах.** Рискованные действия (деплой, удаление,
  внешние рассылки) требуют явного подтверждения человека — см.
  [`global-instructions.md`](global-instructions.md).
- **Код — по стандартам репозитория.** Для инженерных задач сотрудники следуют
  `../CODING_STANDARDS.md` и `../AGENTS.md`.
