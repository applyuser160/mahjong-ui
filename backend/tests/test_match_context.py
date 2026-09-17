"""Tests for seat wind, visible tiles, and match context integration in MatchManager."""

import pytest
from mahjong import TileName, Meld
from match_manager import MatchManager


def test_get_seat_wind():
    mm = MatchManager()

    # When dealer is Player 0 (East)
    mm.dealer_idx = 0
    assert mm.get_seat_wind(0) == TileName.East
    assert mm.get_seat_wind(1) == TileName.South
    assert mm.get_seat_wind(2) == TileName.West
    assert mm.get_seat_wind(3) == TileName.North

    # When dealer is Player 1
    mm.dealer_idx = 1
    assert mm.get_seat_wind(0) == TileName.North
    assert mm.get_seat_wind(1) == TileName.East
    assert mm.get_seat_wind(2) == TileName.South
    assert mm.get_seat_wind(3) == TileName.West

    # When dealer is Player 2
    mm.dealer_idx = 2
    assert mm.get_seat_wind(0) == TileName.West
    assert mm.get_seat_wind(1) == TileName.North
    assert mm.get_seat_wind(2) == TileName.East
    assert mm.get_seat_wind(3) == TileName.South

    # When dealer is Player 3
    mm.dealer_idx = 3
    assert mm.get_seat_wind(0) == TileName.South
    assert mm.get_seat_wind(1) == TileName.West
    assert mm.get_seat_wind(2) == TileName.North
    assert mm.get_seat_wind(3) == TileName.East


def test_get_visible_tiles():
    mm = MatchManager()
    mm.hands[0] = [TileName.OneM, TileName.TwoM, TileName.ThreeM]
    mm.rivers[0] = [TileName.East]
    mm.rivers[1] = [TileName.South, TileName.West]
    mm.rivers[2] = [TileName.North]
    mm.rivers[3] = [TileName.White]
    mm.dora_indicators = [TileName.FiveM]
    mm.melds[1] = [Meld.pon(TileName.NineS)]

    visible = mm.get_visible_tiles(0)
    # Hand (3) + Rivers (1 + 2 + 1 + 1 = 5) + Meld (3) + Dora (1) = 12 tiles
    assert len(visible) == 12
    assert TileName.OneM in visible
    assert TileName.East in visible
    assert TileName.NineS in visible
    assert TileName.FiveM in visible


def test_user_discard_records_with_context():
    mm = MatchManager()
    state = mm.start_new_match(seed=123)
    assert mm.status == "waiting_user_discard"

    user_hand_tiles = list(mm.hands[0])
    discard_tile = user_hand_tiles[0]

    # Discard and check review tracker records decision with context
    res = mm.user_discard(discard_tile.mpsz())
    assert mm.turn_count == 1
    assert mm.review_tracker.get_accuracy_rate() >= 0.0
    report = mm.review_tracker.format_report()
    assert "局後学習振り返りレポート" in report


def test_get_hud_data_with_context():
    mm = MatchManager()
    mm.start_new_match(seed=456)
    hud = mm.get_hud_data()
    assert "candidates" in hud
    assert len(hud["candidates"]) > 0
    assert "best_tile" in hud
    assert "current_rank" in hud


def test_choose_cpu_discard_with_context():
    mm = MatchManager()
    mm.start_new_match(seed=789)
    # CPU 1 chooses discard using full match context
    cpu_hand = list(mm.hands[1])
    discard = mm._choose_cpu_discard(1)
    assert discard in cpu_hand


def test_sort_hand_method():
    mm = MatchManager()
    mm.hands[0] = [
        TileName.NineP,
        TileName.OneM,
        TileName.East,
        TileName.FiveS,
        TileName.ThreeM,
        TileName.Red,
    ]
    mm._sort_hand(0)
    assert mm.hands[0] == [
        TileName.OneM,
        TileName.ThreeM,
        TileName.NineP,
        TileName.FiveS,
        TileName.East,
        TileName.Red,
    ]


from match_manager import ALL_TILES, MatchManager


def test_match_hands_are_sorted_on_start():
    mm = MatchManager()
    mm.start_new_match(seed=42)

    # For player 0 (dealer in seed=42, 14 tiles), the first 13 tiles must be sorted
    pure_hand = mm.hands[0][:13]
    for i in range(len(pure_hand) - 1):
        assert ALL_TILES.index(pure_hand[i]) <= ALL_TILES.index(pure_hand[i + 1])

    # For CPU players (13 tiles), hand must be sorted
    for p in [1, 2, 3]:
        for i in range(len(mm.hands[p]) - 1):
            assert ALL_TILES.index(mm.hands[p][i]) <= ALL_TILES.index(mm.hands[p][i + 1])


def test_discard_keeps_hand_sorted():
    mm = MatchManager()
    mm.start_new_match(seed=42)

    # Discard a tile from human hand
    discard_tile = mm.hands[0][0]
    mm.user_discard(discard_tile.mpsz())

    # After step_cpu_until_user, it advances back to human turn (14 tiles: 13 pure + 1 drawn)
    assert len(mm.hands[0]) == 14
    pure_hand = mm.hands[0][:13]
    for i in range(len(pure_hand) - 1):
        assert ALL_TILES.index(pure_hand[i]) <= ALL_TILES.index(pure_hand[i + 1])


def test_ron_clears_pending_call_options_and_skips_hud():
    mm = MatchManager()
    mm.start_round(seed=1)
    mm.hands[0] = [
        TileName.OneM, TileName.TwoM, TileName.ThreeM,
        TileName.FourM, TileName.FiveM, TileName.SixM,
        TileName.SevenM, TileName.EightM, TileName.NineM,
        TileName.OneP, TileName.TwoP, TileName.ThreeP,
        TileName.East,
    ]
    mm.last_discard = {"player": 1, "tile": "東", "mpsz": "1z"}
    mm.status = "waiting_user_call"
    mm.pending_call_options = {
        "can_ron": True,
        "can_pon": False,
        "can_chi": False,
        "can_kan": False,
        "tile": "東",
        "mpsz": "1z",
    }

    # Execute Ron
    state = mm.user_call_response("ron")

    # Assertions
    assert state["status"] == "round_end"
    assert state["pending_call_options"] is None
    assert mm.pending_call_options is None
    assert state["hud"] == {}
    assert state["round_result"]["winner"] == 0
    assert state["round_result"]["type"] == "ron"
    assert len(mm.hands[0]) == 14

    # Second call attempt should fail gracefully with ValueError
    with pytest.raises(ValueError, match="No call pending for user"):
        mm.user_call_response("ron")


def test_ryuukyoku_clears_pending_call_options():
    mm = MatchManager()
    mm.start_round(seed=1)
    mm.pending_call_options = {"can_ron": True}
    mm._handle_ryuukyoku()
    assert mm.pending_call_options is None
    assert mm.status == "round_end"
    state = mm.get_full_game_state()
    assert state["pending_call_options"] is None
    assert state["hud"] == {}



