# MongoDB memory bootstrap for RomeoFlexVision

Этот документ фиксирует **первый шаг** для интеграции памяти в стек `Romeo PhD + Andrew Swarm + RoboQC`.

## Что делаем первым

1. Подключаем `MongoDBSaver` в LangGraph для short-term памяти (checkpoints).
2. Везде используем стабильный `thread_id` (`user_id` или `session_id`) в `config.configurable`.
3. Поднимаем базовые индексы и TTL-политику до запуска production.

Это даёт сразу воспроизводимую историю диалогов и tool-calls независимо от того,
какой LLM-провайдер выбран в hybrid-router.

## Минимальная реализация

```python
import os
from pymongo import MongoClient
from langgraph.checkpoint.mongodb import MongoDBSaver

client = MongoClient(os.environ["MONGODB_URI"])
checkpointer = MongoDBSaver(
    client=client,
    db_name="romeoflexvision",
    collection_name="checkpoints",
)

graph = builder.compile(checkpointer=checkpointer)

config = {"configurable": {"thread_id": user_id}}
result = graph.invoke(payload, config=config)
```

## Базовые коллекции

- `checkpoints`
- `checkpoint_writes`
- `memories`
- `roboqc_logs`
- `user_profiles`
- `router_quotas`

## Операционные практики (MVP)

- Pruning job: оставлять последние 50–100 checkpoints на thread.
- Индекс: `{ thread_id: 1, checkpoint_id: 1 }`.
- TTL: поле `expires_at` для временных сессий.

## Шаг №2 после bootstrap

Подключить long-term память через `MongoDBAtlasVectorSearch` (RAG/insights),
но только после того как short-term checkpointing стабильно работает в проде.
