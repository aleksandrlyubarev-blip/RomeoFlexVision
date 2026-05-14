"""Сборка LangGraph-графа RoboQC."""

from __future__ import annotations

from functools import partial
from typing import Any, Optional

from rhaef_v2.core.model_router import ModelRouter

from . import nodes
from .state import RoboQCState


def build_graph(router: Optional[ModelRouter] = None) -> Any:
    """Собрать и откомпилировать LangGraph-граф.

    Если ``router`` не передан — создаётся дефолтный (litellm + .env). Для тестов
    передавайте роутер со stub-клиентом.
    """
    try:
        from langgraph.graph import END, StateGraph
    except Exception as exc:  # pragma: no cover
        raise RuntimeError("langgraph is not installed. pip install -e .") from exc

    router = router or ModelRouter()

    g = StateGraph(RoboQCState)

    g.add_node("perception", partial(nodes.perception_node, router=router))
    g.add_node("scene", partial(nodes.scene_node, router=router))
    g.add_node("planner", partial(nodes.planner_node, router=router))
    g.add_node("specialist", partial(nodes.specialist_node, router=router))
    g.add_node("action", partial(nodes.action_node, router=router))
    g.add_node("critic", partial(nodes.critic_node, router=router))

    g.set_entry_point("perception")
    g.add_edge("perception", "scene")
    g.add_edge("scene", "planner")
    g.add_edge("planner", "specialist")
    g.add_edge("specialist", "action")
    g.add_edge("action", "critic")
    g.add_conditional_edges(
        "critic",
        nodes.should_retry,
        {"planner": "planner", "end": END},
    )

    return g.compile()


async def run(initial: RoboQCState, *, router: Optional[ModelRouter] = None) -> RoboQCState:
    """Прогнать кадр через весь pipeline и вернуть финальное состояние."""
    graph = build_graph(router)
    result = await graph.ainvoke(initial)
    if isinstance(result, RoboQCState):
        return result
    return RoboQCState(**result)


__all__ = ["build_graph", "run"]
