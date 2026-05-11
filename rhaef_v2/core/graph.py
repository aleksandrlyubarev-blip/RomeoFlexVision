import operator
from typing import Annotated, Optional, TypedDict

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


async def roboqc_stub(*_: object, **__: object) -> str:
    return "RoboQC stub executed"


async def hardware_bridge_stub(*_: object, **__: object) -> str:
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
