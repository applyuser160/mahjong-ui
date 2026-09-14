export interface PlayerState {
  seat: number;
  seat_wind: string;
  seat_wind_ja: string;
  score: number;
  is_riichi: boolean;
  is_dealer: boolean;
  hand: string[];
  hand_mpsz: string[];
  melds: any[];
  river: string[];
  river_mpsz: string[];
}

export interface CandidateEvaluation {
  discard_tile: string;
  mpsz: string;
  shanten_after: number;
  ev: number;
  remaining_count: number;
  expected_score: number;
  expected_han: number;
  risk_score: number;
  is_safe: boolean;
  primary_yaku: string[];
  placement_ev?: number;
  rank_probabilities?: number[];
  situational_note?: string;
}

export interface OrasuCondition {
  target_rank: number;
  target_player: number;
  diff: number;
  summary: string;
}

export interface AiHudData {
  current_rank?: number;
  current_score?: number;
  is_orasu?: boolean;
  candidates?: CandidateEvaluation[];
  best_tile?: string;
  best_mpsz?: string;
  best_placement_ev?: number;
  best_note?: string;
  orasu_conditions?: OrasuCondition[];
}

export interface UserAction {
  type: "discard" | "tsumo" | "riichi";
  label?: string;
}

export interface CallOptions {
  can_ron: boolean;
  can_pon: boolean;
  can_chi: boolean;
  can_kan: boolean;
  tile: string;
  mpsz: string;
}

export interface RoundResult {
  type: "ron" | "tsumo" | "ryuukyoku";
  winner?: number | null;
  winner_name?: string;
  loser?: number | null;
  loser_name?: string;
  winning_tile?: string;
  winning_mpsz?: string;
  points?: number;
  scores: number[];
  yaku?: string[];
  reason?: string;
}

export interface ReviewSummary {
  total_turns: number;
  optimal_picks_count: number;
  accuracy_rate: number;
  total_ev_loss: number;
  average_ev_loss: number;
  blunders: any[];
}

export interface MatchState {
  round_wind: string;
  round_wind_mpsz: string;
  round_number: number;
  honba: number;
  riichi_sticks: number;
  dealer_idx: number;
  current_turn: number;
  dora_indicators: string[];
  dora_indicators_mpsz: string[];
  remaining_wall_tiles: number;
  players: PlayerState[];
  status: "idle" | "waiting_user_discard" | "waiting_user_call" | "processing_cpu" | "round_end" | "game_over";
  last_discard?: {
    player: number;
    tile: string;
    mpsz: string;
  } | null;
  pending_call_options?: CallOptions | null;
  actions: UserAction[];
  hud?: AiHudData;
  round_result?: RoundResult | null;
  review_summary?: ReviewSummary;
}

export interface DrillProblem {
  tiles: string[];
  mpsz: string[];
  dora_indicator: string;
  dora_mpsz: string;
  turn_number: number;
  best_tile: string;
  best_mpsz: string;
  rationale: string;
  candidates: CandidateEvaluation[];
}
