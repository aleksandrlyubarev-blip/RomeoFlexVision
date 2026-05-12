# Coding Standards (обязательны для Claude Code)

1. Pydantic v2 + strict=True
2. Все классы наследуют BaseModel
3. Чёткие Protocol/ABC для интерфейсов
4. Docstrings + example usage в каждом публичном методе
5. Zero magic, explicit state
6. FrictionGate обязателен для critical функций
7. LangSmith tracing включён по умолчанию
