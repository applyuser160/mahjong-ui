"""Match API and WebSocket router for Mahjong UI.

Provides both RESTful endpoints and real-time WebSocket connection
for human vs CPU mahjong matches.
"""

import json
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from match_manager import MatchManager

router = APIRouter(tags=["match"])

# Global match session instance for simplicity (can be extended to session pool)
current_match: MatchManager = MatchManager()


class DiscardRequest(BaseModel):
    tile_mpsz: str
    declare_riichi: bool = False


class CallRequest(BaseModel):
    action: str  # "pass", "ron", "pon", "chi"


@router.post("/api/match/new")
def new_match(seed: Optional[int] = None) -> Dict[str, Any]:
    """Starts a new match."""
    global current_match
    current_match = MatchManager()
    return current_match.start_new_match(seed=seed)


@router.get("/api/match/state")
def get_match_state() -> Dict[str, Any]:
    """Returns current match state."""
    return current_match.get_full_game_state()


@router.post("/api/match/discard")
def discard_tile(req: DiscardRequest) -> Dict[str, Any]:
    """Discards a tile from human hand."""
    try:
        return current_match.user_discard(req.tile_mpsz, declare_riichi=req.declare_riichi)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/api/match/call")
def handle_call(req: CallRequest) -> Dict[str, Any]:
    """Responds to call prompt."""
    try:
        return current_match.user_call_response(req.action)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/api/match/tsumo")
def declare_tsumo() -> Dict[str, Any]:
    """Declares Tsumo win."""
    try:
        return current_match.user_tsumo()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/api/match/next_round")
def next_round() -> Dict[str, Any]:
    """Proceeds to next round."""
    return current_match.advance_to_next_round()


@router.get("/api/match/review")
def get_review() -> Dict[str, Any]:
    """Retrieves post-game blunder review."""
    return {
        "summary": current_match.review_tracker.to_dict(),
        "report": current_match.review_tracker.format_report(),
        "blunders": current_match.review_tracker.get_blunders_dict(),
    }


# ==========================================
# WebSocket Handler for Live Match
# ==========================================

@router.websocket("/ws/match")
async def websocket_match_endpoint(websocket: WebSocket) -> None:
    """Real-time bi-directional match sync via WebSocket."""
    await websocket.accept()
    global current_match

    # Send current state on connection
    await websocket.send_json(current_match.get_full_game_state())

    try:
        while True:
            text = await websocket.receive_text()
            data = json.loads(text)
            action_type = data.get("type")

            if action_type == "new_match":
                seed = data.get("seed")
                current_match = MatchManager()
                state = current_match.start_new_match(seed=seed)
                await websocket.send_json(state)

            elif action_type == "discard":
                tile_mpsz = data.get("tile_mpsz", "")
                riichi = data.get("declare_riichi", False)
                state = current_match.user_discard(tile_mpsz, declare_riichi=riichi)
                await websocket.send_json(state)

            elif action_type == "call":
                action = data.get("action", "pass")
                state = current_match.user_call_response(action)
                await websocket.send_json(state)

            elif action_type == "tsumo":
                state = current_match.user_tsumo()
                await websocket.send_json(state)

            elif action_type == "next_round":
                state = current_match.advance_to_next_round()
                await websocket.send_json(state)

            elif action_type == "get_state":
                await websocket.send_json(current_match.get_full_game_state())

            else:
                await websocket.send_json({"error": f"Unknown action type: {action_type}"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
        except Exception:
            pass
