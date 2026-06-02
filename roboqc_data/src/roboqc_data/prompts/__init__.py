"""Prompt templates for the experimental inspection LangGraph.

Шесть ролей для пирамиды perception → understanding → planning → specialist → action → critic.
Шаблоны живут в templates/<name>.j2 и подгружаются через PackageLoader — это позволяет
держать их в wheel'е без файловых хаков.

Fastpath: ``render("reasoning_planner", state=...)``.
"""

from __future__ import annotations

from typing import Any, Final

from jinja2 import Environment, PackageLoader, StrictUndefined, select_autoescape

_ENV: Final[Environment] = Environment(
    loader=PackageLoader("roboqc_data", "prompts/templates"),
    autoescape=select_autoescape(disabled_extensions=("j2",)),
    undefined=StrictUndefined,
    trim_blocks=True,
    lstrip_blocks=True,
)

PROMPT_NAMES: Final[tuple[str, ...]] = (
    "vision_perception",
    "scene_understanding",
    "reasoning_planner",
    "roboqc_specialist",
    "action_command",
    "critic_verifier",
)


def render(name: str, **variables: Any) -> str:
    """Отрендерить prompt-шаблон из ``templates/<name>.j2``.

    Args:
        name: Короткое имя шаблона (без расширения), одно из :data:`PROMPT_NAMES`.
        **variables: Переменные Jinja2.

    Returns:
        Рендер в виде ``str`` с блоками ``# System`` / ``# User``.
    """
    if name not in PROMPT_NAMES:
        raise KeyError(f"Unknown prompt '{name}'. Expected one of {PROMPT_NAMES}.")
    return _ENV.get_template(f"{name}.j2").render(**variables)


def as_messages(name: str, **variables: Any) -> list[dict[str, str]]:
    """Рендер + разбор в ``[{role: system}, {role: user}]`` для OpenAI-совместимых API.

    Ожидает в шаблоне два marker'а: ``# System`` и ``# User``.
    """
    body = render(name, **variables)
    system, _, user = body.partition("# User")
    system = system.replace("# System", "", 1).strip()
    user = user.strip()
    if not system or not user:
        raise ValueError(f"Template '{name}' must contain both '# System' and '# User' sections.")
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


__all__ = ["PROMPT_NAMES", "render", "as_messages"]
