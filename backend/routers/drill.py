"""Drill API router for Mahjong UI.

Provides 何切る (What to discard) practice drills, instant evaluation,
and AI tactical explanations.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import mahjong

router = APIRouter(prefix="/api/drill", tags=["drill"])


class CheckAnswerRequest(BaseModel):
    selected_mpsz: str
    problem_candidates: List[Dict[str, Any]]
    best_mpsz: str


class CheckAnswerResponse(BaseModel):
    is_best: bool
    selected_mpsz: str
    best_mpsz: str
    ev_difference: float
    selected_candidate: Optional[Dict[str, Any]] = None
    best_candidate: Optional[Dict[str, Any]] = None
    feedback_message: str


@router.get("/problem")
def get_drill_problem() -> Dict[str, Any]:
    """Generates a random What-to-discard (何切る) problem."""
    try:
        problem = mahjong.generate_drill_problem()
        if problem is None:
            raise HTTPException(status_code=500, detail="Failed to generate drill problem")
        return problem.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check", response_model=CheckAnswerResponse)
def check_drill_answer(req: CheckAnswerRequest) -> CheckAnswerResponse:
    """Checks the user's selected discard against the optimal AI pick."""
    is_best = req.selected_mpsz == req.best_mpsz

    best_cand = None
    user_cand = None
    for c in req.problem_candidates:
        if c.get("mpsz") == req.best_mpsz:
            best_cand = c
        if c.get("mpsz") == req.selected_mpsz:
            user_cand = c

    best_ev = best_cand.get("ev", 0.0) if best_cand else 0.0
    user_ev = user_cand.get("ev", 0.0) if user_cand else 0.0
    diff = float(best_ev - user_ev)

    if is_best:
        msg = f"正解です！AI推奨の最善手 [{req.selected_mpsz}] を選択しました。(EV: {best_ev:.1f})"
    elif diff < 100.0:
        msg = f"準正解（良手）です。最善手は [{req.best_mpsz}] ですが、[{req.selected_mpsz}] も僅差の好手です。(EV差: -{diff:.1f})"
    else:
        msg = f"不正解です。最善手は [{req.best_mpsz}] です。[{req.selected_mpsz}] は受入枚数や打点の損失が大きくなります。(EV差: -{diff:.1f})"

    return CheckAnswerResponse(
        is_best=is_best,
        selected_mpsz=req.selected_mpsz,
        best_mpsz=req.best_mpsz,
        ev_difference=max(0.0, diff),
        selected_candidate=user_cand,
        best_candidate=best_cand,
        feedback_message=msg,
    )
