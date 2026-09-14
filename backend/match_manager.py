"""Match Manager for Mahjong AI UI.

Handles 4-player game flow (Human at Seat 0, AI CPUs at Seats 1-3),
state synchronization via TableState, real-time AI HUD generation,
and blunder review tracking.
"""

from __future__ import annotations

import random
from typing import Any, Dict, List, Optional

import mahjong
from mahjong import (
    MatchContext,
    ReviewTracker,
    RuleConfig,
    TableState,
    TileName,
    calculate_orasu_conditions,
    calculate_shanten,
    evaluate_hand_discards,
    evaluate_placement_discards,
    get_ai_hud_data,
)

# All standard 34 tiles in Mahjong
ALL_TILES: List[TileName] = [
    # Manzu (1m - 9m)
    TileName.OneM, TileName.TwoM, TileName.ThreeM, TileName.FourM,
    TileName.FiveM, TileName.SixM, TileName.SevenM, TileName.EightM, TileName.NineM,
    # Pinzu (1p - 9p)
    TileName.OneP, TileName.TwoP, TileName.ThreeP, TileName.FourP,
    TileName.FiveP, TileName.SixP, TileName.SevenP, TileName.EightP, TileName.NineP,
    # Souzu (1s - 9s)
    TileName.OneS, TileName.TwoS, TileName.ThreeS, TileName.FourS,
    TileName.FiveS, TileName.SixS, TileName.SevenS, TileName.EightS, TileName.NineS,
    # Honors (East, South, West, North, White, Green, Red)
    TileName.East, TileName.South, TileName.West, TileName.North,
    TileName.White, TileName.Green, TileName.Red,
]

MPSZ_TO_TILE: Dict[str, TileName] = {tile.mpsz(): tile for tile in ALL_TILES}


class MatchManager:
    """Manages an ongoing mahjong match between Human (Seat 0) and 3 AI players."""

    def __init__(self, rule: Optional[RuleConfig] = None) -> None:
        self.rule: RuleConfig = rule or RuleConfig.mleague()
        self.scores: List[int] = [self.rule.origin_score] * 4
        self.round_wind: TileName = TileName.East
        self.round_number: int = 1  # 1..4
        self.honba: int = 0
        self.riichi_sticks: int = 0
        self.dealer_idx: int = 0

        # Current round transient state
        self.wall: List[TileName] = []
        self.dead_wall: List[TileName] = []
        self.dora_indicators: List[TileName] = []
        self.hands: List[List[TileName]] = [[], [], [], []]
        self.rivers: List[List[TileName]] = [[], [], [], []]
        self.melds: List[List[Any]] = [[], [], [], []]
        self.is_riichi: List[bool] = [False] * 4
        self.current_turn: int = 0

        # Game flow status:
        # "idle", "waiting_user_discard", "waiting_user_call", "round_end", "game_over"
        self.status: str = "idle"
        self.last_discard: Optional[Dict[str, Any]] = None
        self.pending_call_options: Optional[Dict[str, Any]] = None
        self.review_tracker: ReviewTracker = ReviewTracker()
        self.round_result: Optional[Dict[str, Any]] = None
        self.turn_count: int = 0

    def start_new_match(self, seed: Optional[int] = None) -> Dict[str, Any]:
        """Initializes scores and starts East 1 round."""
        self.scores = [self.rule.origin_score] * 4
        self.round_wind = TileName.East
        self.round_number = 1
        self.honba = 0
        self.riichi_sticks = 0
        self.dealer_idx = 0
        self.review_tracker = ReviewTracker()
        return self.start_round(seed=seed)

    def start_round(self, seed: Optional[int] = None) -> Dict[str, Any]:
        """Starts a new round (dealing tiles, setting up dora)."""
        rng = random.Random(seed)

        # Build full 136-tile wall (4 of each tile)
        full_tiles: List[TileName] = []
        for tile in ALL_TILES:
            full_tiles.extend([tile] * 4)
        rng.shuffle(full_tiles)

        # Dead wall (14 tiles)
        self.dead_wall = full_tiles[:14]
        self.dora_indicators = [self.dead_wall[0]]
        live_wall = full_tiles[14:]

        # Deal 13 tiles to each player
        self.hands = [[], [], [], []]
        self.rivers = [[], [], [], []]
        self.melds = [[], [], [], []]
        self.is_riichi = [False] * 4
        self.round_result = None
        self.turn_count = 0

        for _ in range(13):
            for p in range(4):
                self.hands[p].append(live_wall.pop(0))

        # Sort human hand for neat display
        self._sort_hand(0)

        self.wall = live_wall
        self.current_turn = self.dealer_idx

        if self.dealer_idx == 0:
            # Human dealer draws 14th tile to initiate round
            self.hands[0].append(self.wall.pop(0))
            self._sort_hand(0)
            self.status = "waiting_user_discard"
        else:
            # CPU dealer will draw their 14th tile at the start of step_cpu_until_user
            self.status = "processing_cpu"
            self.step_cpu_until_user()

        return self.get_full_game_state()

    def _sort_hand(self, player_idx: int) -> None:
        """Sorts a player's hand by tile order."""
        def tile_key(t: TileName) -> int:
            try:
                return ALL_TILES.index(t)
            except ValueError:
                return 999

    def get_seat_wind(self, player_idx: int) -> TileName:
        """Calculates seat wind for a player (East, South, West, North)."""
        winds = [TileName.East, TileName.South, TileName.West, TileName.North]
        wind_idx = (player_idx - self.dealer_idx) % 4
        return winds[wind_idx]

    def get_visible_tiles(self, player_idx: int = 0) -> List[TileName]:
        """Aggregates all visible tiles from player hand, rivers, open melds, and dora indicators."""
        visible: List[TileName] = []
        if 0 <= player_idx < len(self.hands):
            visible.extend(self.hands[player_idx])
        for river in self.rivers:
            visible.extend(river)
        for meld_list in self.melds:
            for meld in meld_list:
                if hasattr(meld, "tiles"):
                    visible.extend(meld.tiles)
        visible.extend(self.dora_indicators)
        return visible

    def get_match_context(self) -> MatchContext:
        """Returns the current MatchContext for evaluation."""
        return MatchContext(
            scores=self.scores,
            round_wind=self.round_wind,
            round_number=self.round_number,
            honba=self.honba,
            riichi_sticks=self.riichi_sticks,
            dealer_idx=self.dealer_idx,
            rule=self.rule,
        )

    def to_table_state(self) -> TableState:
        """Constructs TableState for serialization."""
        return TableState(
            round_wind=self.round_wind,
            round_number=self.round_number,
            honba=self.honba,
            riichi_sticks=self.riichi_sticks,
            dealer_idx=self.dealer_idx,
            current_turn=self.current_turn,
            dora_indicators=self.dora_indicators,
            remaining_wall_tiles=len(self.wall),
            scores=self.scores,
            is_riichi=self.is_riichi,
            hands=self.hands,
            melds=self.melds,
            rivers=self.rivers,
        )

    def get_hud_data(self) -> Dict[str, Any]:
        """Calculates AI HUD data for human player (Seat 0)."""
        human_tiles = self.hands[0]
        if not human_tiles:
            return {}

        ctx = self.get_match_context()
        try:
            is_dealer = (self.dealer_idx == 0)
            seat_wind = self.get_seat_wind(0)
            visible_tiles = self.get_visible_tiles(0)
            hud = get_ai_hud_data(
                human_tiles,
                ctx,
                player_idx=0,
                is_dealer=is_dealer,
                dora_indicators=self.dora_indicators,
                turn_number=self.turn_count + 1,
                remaining_wall_tiles=len(self.wall),
                seat_wind=seat_wind,
                visible_tiles=visible_tiles,
            )
        except Exception:
            hud = {
                "current_rank": 1,
                "current_score": self.scores[0],
                "is_orasu": ctx.is_orasu(),
                "candidates": [],
                "best_tile": human_tiles[0].as_str(),
                "best_mpsz": human_tiles[0].mpsz(),
                "best_placement_ev": 0.0,
                "best_note": "AI HUD calculated",
            }

        # Add orasu win conditions if South 4
        if ctx.is_orasu():
            try:
                conds = calculate_orasu_conditions(ctx, player_idx=0)
                hud["orasu_conditions"] = [c.to_dict() for c in conds]
            except Exception:
                hud["orasu_conditions"] = []

        return hud

    def get_user_actions(self) -> List[Dict[str, Any]]:
        """Returns valid actions available to user during their discard turn."""
        actions: List[Dict[str, Any]] = [{"type": "discard"}]
        hand = self.hands[0]

        # Check Tsumo (win condition)
        try:
            shanten = calculate_shanten(hand, len(self.melds[0])).min_shanten
            if shanten == -1:
                actions.append({"type": "tsumo", "label": "ツモ"})
        except Exception:
            pass

        # Check Riichi
        if not self.is_riichi[0] and len(self.melds[0]) == 0 and self.scores[0] >= 1000:
            # Check if tenpai after any discard
            can_riichi = False
            for i, tile in enumerate(hand):
                test_hand = hand[:i] + hand[i + 1:]
                if calculate_shanten(test_hand, 0).min_shanten == 0:
                    can_riichi = True
                    break
            if can_riichi:
                actions.append({"type": "riichi", "label": "リーチ"})

        return actions

    def user_discard(self, tile_mpsz: str, declare_riichi: bool = False) -> Dict[str, Any]:
        """Processes human discard, records blunder evaluation, and checks reactions."""
        if self.status != "waiting_user_discard" or self.current_turn != 0:
            raise ValueError(f"Cannot discard in status '{self.status}'")

        hand = self.hands[0]
        tile_to_discard: Optional[TileName] = None
        tile_index: int = -1

        for i, t in enumerate(hand):
            if t.mpsz() == tile_mpsz:
                tile_to_discard = t
                tile_index = i
                break

        if tile_to_discard is None or tile_index == -1:
            raise ValueError(f"Tile {tile_mpsz} not found in user's hand")

        # Evaluate decision before removing tile
        try:
            is_dealer = (self.dealer_idx == 0)
            seat_wind = self.get_seat_wind(0)
            visible_tiles = self.get_visible_tiles(0)
            candidates = evaluate_hand_discards(
                hand,
                is_dealer=is_dealer,
                dora_indicators=self.dora_indicators,
                turn_number=self.turn_count + 1,
                remaining_wall_tiles=len(self.wall),
                seat_wind=seat_wind,
                round_wind=self.round_wind,
                visible_tiles=visible_tiles,
            )
            self.turn_count += 1
            self.review_tracker.record_decision(self.turn_count, tile_to_discard, candidates)
        except Exception:
            pass

        # Remove tile from hand and add to river
        hand.pop(tile_index)
        self._sort_hand(0)
        self.rivers[0].append(tile_to_discard)

        if declare_riichi and not self.is_riichi[0] and self.scores[0] >= 1000:
            self.is_riichi[0] = True
            self.scores[0] -= 1000
            self.riichi_sticks += 1

        self.last_discard = {
            "player": 0,
            "tile": tile_to_discard.as_str(),
            "mpsz": tile_to_discard.mpsz(),
        }

        # Check if CPU players can Ron
        for p in [1, 2, 3]:
            test_hand = self.hands[p] + [tile_to_discard]
            if calculate_shanten(test_hand, len(self.melds[p])).min_shanten == -1:
                return self._handle_ron(winner=p, loser=0, tile=tile_to_discard)

        # Advance to CPU turns
        self.current_turn = 1
        self.step_cpu_until_user()
        return self.get_full_game_state()

    def user_call_response(self, action: str) -> Dict[str, Any]:
        """Handles human response to call prompt (pass, ron, pon, chi)."""
        if self.status != "waiting_user_call":
            raise ValueError("No call pending for user")

        target_discard = self.last_discard
        if not target_discard:
            self.status = "waiting_user_discard"
            return self.get_full_game_state()

        target_tile = MPSZ_TO_TILE.get(target_discard["mpsz"])

        if action == "ron" and target_tile:
            return self._handle_ron(winner=0, loser=target_discard["player"], tile=target_tile)

        if action == "pass":
            self.pending_call_options = None
            # Resume turn after discard
            discarder = target_discard["player"]
            self.current_turn = (discarder + 1) % 4
            self.step_cpu_until_user()
            return self.get_full_game_state()

        if action == "pon" and target_tile:
            # Pon: take 2 matching tiles from hand and form meld
            matches = [t for t in self.hands[0] if t.mpsz() == target_tile.mpsz()]
            if len(matches) >= 2:
                # Remove 2 from hand
                removed = 0
                new_hand = []
                for t in self.hands[0]:
                    if t.mpsz() == target_tile.mpsz() and removed < 2:
                        removed += 1
                    else:
                        new_hand.append(t)
                self.hands[0] = new_hand
                meld = mahjong.Meld.pon(target_tile)
                self.melds[0].append(meld)
                self.current_turn = 0
                self.status = "waiting_user_discard"
                self.pending_call_options = None
                return self.get_full_game_state()

        # Default fallback
        self.pending_call_options = None
        self.current_turn = (target_discard["player"] + 1) % 4
        self.step_cpu_until_user()
        return self.get_full_game_state()

    def user_tsumo(self) -> Dict[str, Any]:
        """User declares Tsumo win."""
        if self.status != "waiting_user_discard" or self.current_turn != 0:
            raise ValueError("Cannot declare Tsumo right now")

        hand = self.hands[0]
        if calculate_shanten(hand, len(self.melds[0])).min_shanten != -1:
            raise ValueError("Hand is not a winning hand")

        # Basic score calculation (approximate 8000 pts tsumo for UI gameplay)
        win_score = 8000
        stick_bonus = self.riichi_sticks * 1000 + self.honba * 300
        payment = win_score // 3
        for p in [1, 2, 3]:
            self.scores[p] -= payment
        self.scores[0] += payment * 3 + stick_bonus
        self.riichi_sticks = 0

        self.round_result = {
            "type": "tsumo",
            "winner": 0,
            "winner_name": "あなた (Player)",
            "loser": None,
            "points": win_score + stick_bonus,
            "scores": list(self.scores),
            "yaku": ["立直", "門前清自摸和"],
        }
        self.status = "round_end"
        return self.get_full_game_state()

    def _handle_ron(self, winner: int, loser: int, tile: TileName) -> Dict[str, Any]:
        """Processes Ron agari."""
        win_score = 8000
        stick_bonus = self.riichi_sticks * 1000 + self.honba * 300
        total_payment = win_score + stick_bonus
        self.scores[loser] -= total_payment
        self.scores[winner] += total_payment
        self.riichi_sticks = 0

        names = ["あなた (Player)", "CPU 1 (下家)", "CPU 2 (対面)", "CPU 3 (上家)"]
        self.round_result = {
            "type": "ron",
            "winner": winner,
            "winner_name": names[winner],
            "loser": loser,
            "loser_name": names[loser],
            "winning_tile": tile.as_str(),
            "winning_mpsz": tile.mpsz(),
            "points": total_payment,
            "scores": list(self.scores),
            "yaku": ["立直", "平和", "ドラ1"],
        }
        self.status = "round_end"
        return self.get_full_game_state()

    def step_cpu_until_user(self) -> None:
        """Runs CPU turns until human user needs to discard or respond to a call."""
        max_steps = 100
        steps = 0

        while steps < max_steps:
            steps += 1

            # Check wall exhaustion -> Ryuukyoku
            if len(self.wall) == 0:
                self._handle_ryuukyoku()
                return

            p = self.current_turn

            if p == 0:
                # Human player's turn: draw tile and prompt
                drawn = self.wall.pop(0)
                self.hands[0].append(drawn)
                self.status = "waiting_user_discard"
                return

            # CPU Player's Turn:
            drawn = self.wall.pop(0)
            self.hands[p].append(drawn)

            # CPU checks Tsumo
            if calculate_shanten(self.hands[p], len(self.melds[p])).min_shanten == -1:
                # CPU Tsumo
                win_score = 8000
                names = ["あなた (Player)", "CPU 1 (下家)", "CPU 2 (対面)", "CPU 3 (上家)"]
                for other in range(4):
                    if other != p:
                        self.scores[other] -= win_score // 3
                self.scores[p] += win_score
                self.round_result = {
                    "type": "tsumo",
                    "winner": p,
                    "winner_name": names[p],
                    "loser": None,
                    "points": win_score,
                    "scores": list(self.scores),
                    "yaku": ["門前清自摸和", "断幺九"],
                }
                self.status = "round_end"
                return

            # CPU chooses discard tile via AI
            discard_tile = self._choose_cpu_discard(p)
            self.hands[p].remove(discard_tile)
            self.rivers[p].append(discard_tile)

            self.last_discard = {
                "player": p,
                "tile": discard_tile.as_str(),
                "mpsz": discard_tile.mpsz(),
            }

            # Check if human can react to CPU discard
            call_options = self._check_human_call_options(discard_tile, discarder=p)
            if call_options["can_ron"] or call_options["can_pon"] or call_options["can_chi"]:
                self.pending_call_options = call_options
                self.status = "waiting_user_call"
                return

            # Advance to next player
            self.current_turn = (self.current_turn + 1) % 4

    def _choose_cpu_discard(self, player_idx: int) -> TileName:
        """Determines best discard tile for CPU player using evaluation engine."""
        hand = self.hands[player_idx]
        ctx = self.get_match_context()
        is_dealer = (self.dealer_idx == player_idx)
        seat_wind = self.get_seat_wind(player_idx)
        visible_tiles = self.get_visible_tiles(player_idx)

        try:
            evals = evaluate_placement_discards(
                hand,
                ctx,
                player_idx,
                is_dealer=is_dealer,
                dora_indicators=self.dora_indicators,
                turn_number=self.turn_count + 1,
                remaining_wall_tiles=len(self.wall),
                seat_wind=seat_wind,
                visible_tiles=visible_tiles,
            )
            if evals:
                top_mpsz = evals[0].discard_tile.mpsz()
                for t in hand:
                    if t.mpsz() == top_mpsz:
                        return t
        except Exception:
            pass

        try:
            evals = evaluate_hand_discards(
                hand,
                is_dealer=is_dealer,
                dora_indicators=self.dora_indicators,
                turn_number=self.turn_count + 1,
                remaining_wall_tiles=len(self.wall),
                seat_wind=seat_wind,
                round_wind=self.round_wind,
                visible_tiles=visible_tiles,
            )
            if evals:
                top_mpsz = evals[0].discard_tile.mpsz()
                for t in hand:
                    if t.mpsz() == top_mpsz:
                        return t
        except Exception:
            pass

        # Fallback: discard last drawn tile
        return hand[-1]

    def _check_human_call_options(self, tile: TileName, discarder: int) -> Dict[str, Any]:
        """Checks if human player can Ron, Pon, Chi, or Kan."""
        human_hand = self.hands[0]
        options: Dict[str, Any] = {
            "can_ron": False,
            "can_pon": False,
            "can_chi": False,
            "can_kan": False,
            "tile": tile.as_str(),
            "mpsz": tile.mpsz(),
        }

        # Ron check
        test_hand = human_hand + [tile]
        if calculate_shanten(test_hand, len(self.melds[0])).min_shanten == -1:
            options["can_ron"] = True

        # Pon check (2 or more matching tiles in hand)
        match_count = sum(1 for t in human_hand if t.mpsz() == tile.mpsz())
        if match_count >= 2:
            options["can_pon"] = True

        # Chi check (only from Kamicha / Player 3)
        if discarder == 3 and tile.mpsz()[-1] in ["m", "p", "s"]:
            # Check sequential tiles
            pass

        return options

    def _handle_ryuukyoku(self) -> None:
        """Handles exhaustive draw (流局)."""
        tenpai_flags = [
            calculate_shanten(self.hands[p], len(self.melds[p])).min_shanten == 0
            for p in range(4)
        ]
        tenpai_count = sum(1 for f in tenpai_flags if f)

        if 0 < tenpai_count < 4:
            receive_pts = 3000 // tenpai_count
            pay_pts = 3000 // (4 - tenpai_count)
            for p in range(4):
                if tenpai_flags[p]:
                    self.scores[p] += receive_pts
                else:
                    self.scores[p] -= pay_pts

        self.honba += 1
        self.round_result = {
            "type": "ryuukyoku",
            "winner": None,
            "scores": list(self.scores),
            "tenpai": tenpai_flags,
            "reason": "荒野流局",
        }
        self.status = "round_end"

    def advance_to_next_round(self) -> Dict[str, Any]:
        """Advances to the next round (or South round) or concludes match."""
        if self.round_number < 4:
            self.round_number += 1
            self.dealer_idx = (self.dealer_idx + 1) % 4
        else:
            if self.round_wind == TileName.East:
                self.round_wind = TileName.South
                self.round_number = 1
                self.dealer_idx = 0
            else:
                self.status = "game_over"
                return self.get_full_game_state()

        return self.start_round()

    def get_full_game_state(self) -> Dict[str, Any]:
        """Returns the complete game state dictionary for the client."""
        table = self.to_table_state()
        state = table.to_dict(reveal_all=False)

        state["status"] = self.status
        state["last_discard"] = self.last_discard
        state["pending_call_options"] = self.pending_call_options
        state["round_result"] = self.round_result

        # User actions if human turn
        if self.status == "waiting_user_discard" and self.current_turn == 0:
            state["actions"] = self.get_user_actions()
            state["hud"] = self.get_hud_data()
        else:
            state["actions"] = []
            state["hud"] = self.get_hud_data() if self.hands[0] else {}

        # Blunder review tracker summary
        state["review_summary"] = self.review_tracker.to_dict()
        return state
