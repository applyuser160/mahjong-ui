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
