import operator
from typing import Annotated, Optional, TypedDict
from uuid import uuid4

from rhaef_v2.tools.interfaces import InspectionRequest, StubRoboQCClient

from .model_router import FrictionGate, ModelRouter, TaskCategory

try:
    from fastapi import FastAPI
except Exception:  # pragma: no cover
    class FastAPI:  # type: ignore
        def __init__(self, *_: object, **__: object) -> None:
            pass

        def get(self, *_: object, **__: object):
            def decorator(func):
                return func

            return decorator

try:
    from fastapi.responses import JSONResponse
except Exception:  # pragma: no cover
    JSONResponse = None  # type: ignore


try:
    from langgraph.graph import END, StateGraph
    from langgraph.prebuilt import ToolNode
except Exception:  # pragma: no cover
    END = "END"  # type: ignore
    StateGraph = None  # type: ignore
    ToolNode = None  # type: ignore

router = ModelRouter()
app = FastAPI(title="RHAEF v2")

try:
    from rhaef_v2.api.routes import router as api_router
    app.include_router(api_router)
except Exception:
    pass


class AgentState(TypedDict):
    messages: Annotated[list, operator.add]
    next: str
    category: TaskCategory
    friction: Optional[FrictionGate]


_roboqc_client = StubRoboQCClient()


async def roboqc_stub(*_: object, **__: object) -> str:
    """Run a stub RoboQC inspection and return the JSON-serialised result."""
    result = await _roboqc_client.run_check(
        InspectionRequest(
            inspection_id=f"insp-{uuid4().hex[:8]}",
            image_uri="memory://placeholder",
        )
    )
    return result.model_dump_json()


async def hardware_bridge_stub(*_: object, **__: object) -> str:
    """Run a stub hardware-bridge call and return a constant marker."""
    return "Hardware bridge stub executed"


async def romeo_prime_node(state: AgentState) -> dict[str, object]:
    response = await router.route(
        category=TaskCategory.ORCHESTRATION,
        messages=state["messages"],
        friction=FrictionGate.critical("Orchestration decision") if len(state["messages"]) > 5 else None,
    )
    return {"messages": [response.choices[0].message], "next": "coding"}


async def claude_coder_node(state: AgentState) -> dict[str, object]:
    response = await router.route(
        category=TaskCategory.CODING,
        messages=state["messages"],
        friction=FrictionGate.critical("Production code generation"),
    )
    return {"messages": [response.choices[0].message], "next": "tools"}


def route_after_romeo(state: AgentState) -> str:
    if state.get("next") == "coding":
        return "claude_coder"
    return END


if StateGraph is not None and ToolNode is not None:
    workflow = StateGraph(AgentState)
    workflow.add_node("romeo_prime", romeo_prime_node)
    workflow.add_node("claude_coder", claude_coder_node)
    workflow.add_node("tools", ToolNode(tools=[roboqc_stub, hardware_bridge_stub]))
    workflow.set_entry_point("romeo_prime")
    workflow.add_conditional_edges("romeo_prime", route_after_romeo)
    workflow.add_edge("claude_coder", "tools")
    workflow.add_edge("tools", "romeo_prime")
    rhaef_graph = workflow.compile()
else:
    rhaef_graph = None


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


async def gemini_smoke_check(model_router: ModelRouter) -> dict[str, object]:
    """Perform exactly one real Gemini call and report whether Gemini actually answered.

    This is the production proof for the XPRIZE requirement of at least one Gemini
    API call in the *deployed* application. It returns ``status="degraded"`` (not
    ``"ok"``) when the router silently falls back off the Vertex/Gemini path onto a
    non-Gemini model, so a health probe catches a broken Vertex wiring even when no
    exception is raised.
    """
    requested = model_router._select_model(TaskCategory.GEMINI)
    response = await model_router.route(
        category=TaskCategory.GEMINI,
        messages=[{"role": "user", "content": "Reply with a single word: pong"}],
        temperature=0.0,
        max_tokens=16,
    )
    # litellm sets ``response.model`` to the model that actually answered, which
    # differs from ``requested`` when the fallback path fired.
    answered = str(getattr(response, "model", "") or requested)
    message = response.choices[0].message
    content = message["content"] if isinstance(message, dict) else getattr(message, "content", "")
    gemini_used = "gemini" in answered.lower()
    return {
        "status": "ok" if gemini_used else "degraded",
        "requested_model": requested,
        "answered_model": answered,
        "gemini_used": gemini_used,
        "reply": content,
    }


@app.get("/healthz/gemini")
async def gemini_smoke() -> object:
    """Liveness probe that exercises the real Vertex/Gemini path end-to-end."""
    try:
        result = await gemini_smoke_check(router)
    except Exception as exc:  # pragma: no cover - exercised in deployment, not unit tests
        result = {
            "status": "error",
            "error": type(exc).__name__,
            "detail": str(exc)[:300],
        }
    if JSONResponse is not None and result.get("status") != "ok":
        return JSONResponse(status_code=503, content=result)
    return result
