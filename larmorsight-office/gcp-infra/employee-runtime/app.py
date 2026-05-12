"""Cloud Run runtime для AI-сотрудника LarmorSight.

На старте контейнер загружает «навык» сотрудника из бакета Cloud Storage
(global-instructions.md + employees/<name>/SKILL.md + references/) и собирает из
него «замороженный» системный промпт. Эндпоинт `POST /run` вызывает Anthropic
Messages API с этим системным промптом (prompt caching) плюс задачей из запроса.

Переменные окружения (задаёт gcp-infra/modules/ai-employee):
  LARMORSIGHT_EMPLOYEE       имя сотрудника (папка в employees/)
  LARMORSIGHT_SKILLS_BUCKET  бакет GCS с навыками (employees/, references/, global-instructions.md)
  LARMORSIGHT_SKILL_PATH     путь к SKILL.md этого сотрудника внутри бакета
  ANTHROPIC_API_KEY          инъектится из Secret Manager
  PORT                       задаёт Cloud Run
Необязательные:
  LARMORSIGHT_MODEL          по умолчанию "claude-opus-4-7"
  LARMORSIGHT_EFFORT         "low" | "medium" | "high" | "xhigh" | "max" (по умолчанию "high")
  LARMORSIGHT_THINKING       "adaptive" | "disabled" (по умолчанию "adaptive")
  LARMORSIGHT_MAX_TOKENS     по умолчанию 16000
"""
from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import Optional

import anthropic
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("larmorsight.employee")

EMPLOYEE = os.environ.get("LARMORSIGHT_EMPLOYEE", "unknown")
SKILLS_BUCKET = os.environ.get("LARMORSIGHT_SKILLS_BUCKET", "")
SKILL_PATH = os.environ.get("LARMORSIGHT_SKILL_PATH", f"employees/{EMPLOYEE}/SKILL.md")
MODEL = os.environ.get("LARMORSIGHT_MODEL", "claude-opus-4-7")
EFFORT = os.environ.get("LARMORSIGHT_EFFORT", "high")
THINKING_MODE = os.environ.get("LARMORSIGHT_THINKING", "adaptive")
MAX_TOKENS = int(os.environ.get("LARMORSIGHT_MAX_TOKENS", "16000"))

# Общие референсы офиса, которые имеет смысл всегда держать в системном промпте.
SHARED_REFERENCES = (
    "references/brand/brand-guidelines.md",
    "references/company/overview.md",
)

app = FastAPI(title=f"LarmorSight employee: {EMPLOYEE}")


def _read_gcs_text(bucket, name: str) -> Optional[str]:
    blob = bucket.blob(name)
    if not blob.exists():
        return None
    return blob.download_as_text(encoding="utf-8")


@lru_cache(maxsize=1)
def _skill_sections() -> list[tuple[str, str]]:
    """[(заголовок, текст), ...] в детерминированном порядке.

    Пустой список, если бакет недоступен/не задан — сервис всё равно
    стартует (healthz работает), но отвечает только по базовым инструкциям.
    Результат кэшируется на время жизни контейнера; чтобы подхватить новые
    навыки, перезапустите сервис (или передеплойте — Cloud Run создаст новую ревизию).
    """
    if not SKILLS_BUCKET:
        log.warning("LARMORSIGHT_SKILLS_BUCKET не задан — работаю без загруженного навыка")
        return []
    try:
        from google.cloud import storage  # ленивый импорт: модуль грузится и без GCP-библиотек
    except Exception as exc:  # pragma: no cover
        log.warning("google-cloud-storage недоступен: %s", exc)
        return []
    try:
        client = storage.Client()
        bucket = client.bucket(SKILLS_BUCKET)
        sections: list[tuple[str, str]] = []

        gi = _read_gcs_text(bucket, "global-instructions.md")
        if gi:
            sections.append(("LarmorSight — глобальные инструкции", gi))

        skill = _read_gcs_text(bucket, SKILL_PATH)
        if skill:
            sections.append((f"Роль: {EMPLOYEE} (SKILL.md)", skill))

        prefix = f"employees/{EMPLOYEE}/references/"
        for blob in sorted(client.list_blobs(SKILLS_BUCKET, prefix=prefix), key=lambda b: b.name):
            if blob.name.endswith("/"):
                continue
            sections.append((f"Референс: {blob.name[len(prefix):]}", blob.download_as_text(encoding="utf-8")))

        for shared_name in SHARED_REFERENCES:
            txt = _read_gcs_text(bucket, shared_name)
            if txt:
                sections.append((f"Общий референс: {shared_name}", txt))

        log.info("загружено %d секция(й) навыка из gs://%s", len(sections), SKILLS_BUCKET)
        return sections
    except Exception as exc:  # pragma: no cover
        log.exception("не удалось загрузить навык из GCS: %s", exc)
        return []


@lru_cache(maxsize=1)
def system_prompt() -> str:
    sections = _skill_sections()
    parts = [
        f"Ты — AI-сотрудник LarmorSight в роли «{EMPLOYEE}». "
        "Действуй строго в рамках своей роли и общих инструкций ниже. "
        "Перед сдачей результата пройди свой чек-лист качества из SKILL.md. "
        "Рискованные действия (внешние коммуникации от лица компании, расходы, удаление, "
        "развёртывание, работа с ПДн) не выполняй сам — опиши, что нужно сделать, и отметь, "
        "что требуется подтверждение оператора. Отвечай на языке запроса; сначала вывод, потом детали."
    ]
    if not sections:
        parts.append(
            "\n\n[ВНИМАНИЕ: навык не загружен из Cloud Storage — работаешь только по этим базовым "
            "инструкциям. Сообщи об этом в ответе и попроси оператора синхронизировать навыки "
            "(`deploy-to-gcp.sh <employee>` или команда `/sync-with-gcp`).]"
        )
    for title, text in sections:
        parts.append(f"\n\n===== {title} =====\n{text.strip()}")
    return "".join(parts)


@lru_cache(maxsize=1)
def anthropic_client() -> "anthropic.Anthropic":
    return anthropic.Anthropic()  # читает ANTHROPIC_API_KEY из окружения


class RunRequest(BaseModel):
    task: str = Field(..., min_length=1, description="Задача для сотрудника")
    context: Optional[str] = Field(None, description="Дополнительный контекст: данные, ссылки, ограничения")
    max_tokens: Optional[int] = Field(None, ge=256, le=128_000, description="Переопределить лимит выходных токенов")


class RunResponse(BaseModel):
    employee: str
    model: str
    output: str
    stop_reason: Optional[str]
    usage: dict


@app.get("/")
def root() -> dict:
    return {
        "service": "larmorsight-employee",
        "employee": EMPLOYEE,
        "model": MODEL,
        "skill_loaded": bool(_skill_sections()),
        "endpoints": ["GET /healthz", "POST /run"],
    }


@app.get("/healthz")
def healthz() -> dict:
    return {"ok": True, "employee": EMPLOYEE}


@app.post("/run", response_model=RunResponse)
def run(req: RunRequest) -> RunResponse:
    user_text = f"Задача:\n{req.task.strip()}"
    if req.context and req.context.strip():
        user_text += f"\n\nДополнительный контекст:\n{req.context.strip()}"

    thinking = {"type": "adaptive"} if THINKING_MODE == "adaptive" else {"type": "disabled"}

    kwargs: dict = dict(
        model=MODEL,
        max_tokens=req.max_tokens or MAX_TOKENS,
        # Замороженный системный промпт идёт первым и кэшируется (prompt caching);
        # волатильная задача — в messages, после точки кэширования.
        system=[{"type": "text", "text": system_prompt(), "cache_control": {"type": "ephemeral"}}],
        thinking=thinking,
        messages=[{"role": "user", "content": user_text}],
    )
    if EFFORT:
        kwargs["output_config"] = {"effort": EFFORT}

    try:
        # Стримим (защита от таймаутов на длинных ответах) и берём итоговое сообщение.
        with anthropic_client().messages.stream(**kwargs) as stream:
            message = stream.get_final_message()
    except anthropic.APIStatusError as exc:
        log.warning(
            "Anthropic API error %s: %s (request_id=%s)",
            exc.status_code, getattr(exc, "message", exc), getattr(exc, "_request_id", None),
        )
        status = 502 if exc.status_code >= 500 else exc.status_code
        raise HTTPException(status_code=status, detail=str(getattr(exc, "message", exc)))
    except anthropic.APIConnectionError as exc:
        raise HTTPException(status_code=503, detail=f"upstream connection error: {exc}")

    text = "".join(b.text for b in message.content if b.type == "text").strip()
    try:
        usage = message.usage.model_dump()
    except AttributeError:  # pragma: no cover - на случай старого SDK
        usage = dict(message.usage)
    return RunResponse(
        employee=EMPLOYEE,
        model=message.model,
        output=text,
        stop_reason=message.stop_reason,
        usage=usage,
    )


if __name__ == "__main__":  # локальный запуск
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))
