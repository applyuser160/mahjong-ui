"""Unit and integration tests for FastAPI backend and MatchManager."""

import pytest
from fastapi.testclient import TestClient
from main import app
from match_manager import MatchManager

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_drill_endpoints():
    # 1. Get problem
    prob_res = client.get("/api/drill/problem")
    assert prob_res.status_code == 200
    data = prob_res.json()
    assert "tiles" in data
    assert "mpsz" in data
    assert "best_mpsz" in data
    assert len(data["candidates"]) > 0

    # 2. Check answer (correct answer)
    check_res = client.post(
        "/api/drill/check",
        json={
            "selected_mpsz": data["best_mpsz"],
            "best_mpsz": data["best_mpsz"],
            "problem_candidates": data["candidates"],
        },
    )
    assert check_res.status_code == 200
    check_data = check_res.json()
    assert check_data["is_best"] is True
    assert check_data["ev_difference"] == 0.0

    # 3. Check answer (wrong answer)
    wrong_candidate = next(
        (c for c in data["candidates"] if c["mpsz"] != data["best_mpsz"]), None
    )
    if wrong_candidate:
        wrong_res = client.post(
            "/api/drill/check",
            json={
                "selected_mpsz": wrong_candidate["mpsz"],
                "best_mpsz": data["best_mpsz"],
                "problem_candidates": data["candidates"],
            },
        )
        assert wrong_res.status_code == 200
        wrong_data = wrong_res.json()
        assert wrong_data["is_best"] is False


def test_match_flow_rest():
    # Start match with fixed seed for determinism
    res = client.post("/api/match/new?seed=12345")
    assert res.status_code == 200
    state = res.json()
    assert "players" in state
    assert len(state["players"]) == 4
    assert len(state["players"][0]["hand"]) == 14  # Human dealer East 1 starts with 14
    assert state["status"] == "waiting_user_discard"

    # Human discards 1st tile
    tile_to_discard = state["players"][0]["hand_mpsz"][0]
    disc_res = client.post(
        "/api/match/discard",
        json={"tile_mpsz": tile_to_discard, "declare_riichi": False},
    )
    assert disc_res.status_code == 200
    new_state = disc_res.json()
    assert len(new_state["players"][0]["river"]) >= 1

    # Check review endpoint
    rev_res = client.get("/api/match/review")
    assert rev_res.status_code == 200
    rev_data = rev_res.json()
    assert rev_data["summary"]["total_turns"] >= 1


def test_match_websocket():
    with client.websocket_connect("/ws/match") as ws:
        init_state = ws.receive_json()
        assert "players" in init_state

        # Start new match via websocket
        ws.send_json({"type": "new_match", "seed": 42})
        new_state = ws.receive_json()
        assert new_state["status"] == "waiting_user_discard"

        # Discard via websocket
        first_tile = new_state["players"][0]["hand_mpsz"][0]
        ws.send_json({"type": "discard", "tile_mpsz": first_tile, "declare_riichi": False})
        next_state = ws.receive_json()
        assert len(next_state["players"][0]["river"]) >= 1


def test_full_round_play_and_advance():
    """Verifies that a round can be played from start to finish and advance to the next round."""
    mgr = MatchManager()
    mgr.start_new_match(seed=42)

    # Play until round ends
    steps = 0
    while mgr.status not in ["round_end", "game_over"] and steps < 200:
        steps += 1
        if mgr.status == "waiting_user_discard":
            mgr.user_discard(mgr.hands[0][-1].mpsz())
        elif mgr.status == "waiting_user_call":
            mgr.user_call_response("pass")

    assert mgr.status == "round_end"
    assert mgr.round_result is not None
    assert mgr.round_result["type"] in ["ron", "tsumo", "ryuukyoku"]

    # Advance to next round
    next_state = mgr.advance_to_next_round()
    assert next_state["status"] in ["waiting_user_discard", "waiting_user_call", "processing_cpu"]
    assert next_state["round_number"] in [1, 2]

