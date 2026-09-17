import { useState } from "react";
import type { MatchState } from "../../types/mahjong";
import { Tile } from "../Common/Tile";
import { ActionPrompt } from "./ActionPrompt";
import { Trophy, Award } from "lucide-react";

interface TableLayoutProps {
  state: MatchState;
  onDiscard: (mpsz: string, declareRiichi: boolean) => void;
  onCallAction: (actionType: string) => void;
  onNextRound: () => void;
  onNewMatch: () => void;
}

export const TableLayout: React.FC<TableLayoutProps> = ({
  state,
  onDiscard,
  onCallAction,
  onNextRound,
  onNewMatch,
}) => {
  const [selectedMpsz, setSelectedMpsz] = useState<string | null>(null);
  const [isRiichiSelected, setIsRiichiSelected] = useState<boolean>(false);

  const human = state.players[0];
  const cpu1 = state.players[1]; // 下家 (Right)
  const cpu2 = state.players[2]; // 対面 (Top)
  const cpu3 = state.players[3]; // 上家 (Left)

  const isHumanTurn = state.status === "waiting_user_discard" && state.current_turn === 0;

  const handleTileClick = (mpsz: string) => {
    if (!isHumanTurn) return;
    if (selectedMpsz === mpsz) {
      onDiscard(mpsz, isRiichiSelected);
      setSelectedMpsz(null);
      setIsRiichiSelected(false);
    } else {
      setSelectedMpsz(mpsz);
    }
  };

  const handleConfirmDiscard = () => {
    if (selectedMpsz && isHumanTurn) {
      onDiscard(selectedMpsz, isRiichiSelected);
      setSelectedMpsz(null);
      setIsRiichiSelected(false);
    }
  };

  const renderRiver = (riverMpsz: string[], isCurrentPlayer: boolean) => {
    return (
      <div className="grid grid-cols-6 gap-1 p-2 bg-slate-950/50 rounded-xl border border-slate-800/70 min-w-[230px] min-h-[110px] shadow-inner">
        {riverMpsz.map((mpsz, idx) => {
          const isLatest = idx === riverMpsz.length - 1 && isCurrentPlayer;
          return (
            <div key={`${mpsz}-${idx}`} className="flex items-center justify-center">
              <Tile
                mpsz={mpsz}
                size="sm"
                highlighted={isLatest}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-between w-full h-full min-h-[740px] bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 rounded-2xl p-4 md:p-6 shadow-2xl border border-emerald-750/50 select-none overflow-hidden">
      {/* Table Center Felt Pattern Background */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1.5px,transparent_1.5px)] [background-size:20px_20px] pointer-events-none" />

      {/* TOP: CPU 2 (対面) */}
      <div className="flex flex-col items-center gap-2 z-10">
        <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-900/90 rounded-full border border-slate-700/70 text-xs font-semibold shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          <span className="text-slate-200">対面: CPU 2 ({cpu2?.seat_wind_ja})</span>
          <span className="text-amber-400 font-mono font-bold text-sm">{cpu2?.score.toLocaleString()} 点</span>
          {cpu2?.is_riichi && <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[11px] font-bold shadow animate-pulse">立直</span>}
        </div>
        {/* CPU 2 Hand (Face-down tiles) */}
        <div className="flex items-center gap-0.5">
          {cpu2?.hand.map((_, idx) => (
            <Tile key={`cpu2-hand-${idx}`} mpsz="back" size="xs" />
          ))}
        </div>
        {/* CPU 2 River */}
        {renderRiver(cpu2?.river_mpsz || [], state.current_turn === 2)}
      </div>

      {/* MIDDLE ROW: CPU 3 (Left), Center Plate, CPU 1 (Right) */}
      <div className="flex items-center justify-between w-full px-2 md:px-6 z-10">
        {/* LEFT: CPU 3 (上家) */}
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/90 rounded-full border border-slate-700/70 text-xs font-semibold shadow-md">
            <span className="text-slate-200">上家: CPU 3 ({cpu3?.seat_wind_ja})</span>
            <span className="text-amber-400 font-mono font-bold text-sm">{cpu3?.score.toLocaleString()}</span>
            {cpu3?.is_riichi && <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[11px] font-bold shadow animate-pulse">立直</span>}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-0.5">
              {cpu3?.hand.slice(0, 13).map((_, idx) => (
                <div key={`cpu3-hand-${idx}`} className="w-9 h-4 bg-amber-900/90 border border-amber-950 rounded-sm shadow-sm" />
              ))}
            </div>
            {renderRiver(cpu3?.river_mpsz || [], state.current_turn === 3)}
          </div>
        </div>

        {/* CENTER TABLE PLATE */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-950/95 border-2 border-emerald-500/40 rounded-2xl shadow-2xl min-w-[240px] backdrop-blur-lg">
          <div className="flex items-center gap-2.5 text-base font-bold text-emerald-400 mb-1.5">
            <span className="text-amber-300 font-serif text-lg tracking-wider">{state.round_wind}{state.round_number}局</span>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{state.honba} 本場</span>
          </div>

          {/* Dora Indicators */}
          <div className="flex flex-col items-center gap-1.5 my-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 w-full shadow-inner">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ドラ表示牌</span>
            <div className="flex items-center gap-1.5">
              {state.dora_indicators_mpsz.map((mpsz, idx) => (
                <Tile key={`dora-${idx}`} mpsz={mpsz} size="sm" isDora />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between w-full px-2 pt-1 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">供託:</span>
              <span className="text-amber-400 font-bold font-mono text-sm">{state.riichi_sticks * 1000}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">残牌:</span>
              <span className="text-emerald-300 font-bold font-mono text-base">{state.remaining_wall_tiles}</span>
            </div>
          </div>
        </div>

        {/* RIGHT: CPU 1 (下家) */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/90 rounded-full border border-slate-700/70 text-xs font-semibold shadow-md">
            {cpu1?.is_riichi && <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[11px] font-bold shadow animate-pulse">立直</span>}
            <span className="text-amber-400 font-mono font-bold text-sm">{cpu1?.score.toLocaleString()}</span>
            <span className="text-slate-200">下家: CPU 1 ({cpu1?.seat_wind_ja})</span>
          </div>
          <div className="flex items-center gap-4">
            {renderRiver(cpu1?.river_mpsz || [], state.current_turn === 1)}
            <div className="flex flex-col gap-0.5">
              {cpu1?.hand.slice(0, 13).map((_, idx) => (
                <div key={`cpu1-hand-${idx}`} className="w-9 h-4 bg-amber-900/90 border border-amber-950 rounded-sm shadow-sm" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM: HUMAN (自家) */}
      <div className="flex flex-col items-center gap-2.5 w-full z-20">
        {/* Human River */}
        {renderRiver(human?.river_mpsz || [], state.current_turn === 0)}

        {/* Action Prompt (Tsumo / Riichi / Ron / Pon / Pass) */}
        <ActionPrompt
          userActions={state.actions}
          callOptions={state.pending_call_options}
          matchStatus={state.status}
          onAction={onCallAction}
          isRiichiSelected={isRiichiSelected}
          onToggleRiichi={() => setIsRiichiSelected(!isRiichiSelected)}
        />

        {/* Human Info Bar */}
        <div className="flex items-center justify-between w-full max-w-4xl px-5 py-2 bg-slate-900/95 rounded-t-xl border-t border-x border-slate-700/80 text-xs shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white text-sm">あなた (自家 - {human?.seat_wind_ja})</span>
            {human?.is_dealer && <span className="px-2 py-0.5 bg-amber-600 text-slate-950 font-black rounded text-[11px] shadow">親</span>}
            {human?.is_riichi && <span className="px-2 py-0.5 bg-red-600 text-white font-bold rounded text-[11px] shadow">立直</span>}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">点数:</span>
            <span className="text-amber-400 font-mono font-black text-base">{human?.score.toLocaleString()} 点</span>
            {selectedMpsz && isHumanTurn && (
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="ml-3 px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg shadow-lg transition-all text-xs tracking-wide transform hover:scale-105"
              >
                選択牌を切る
              </button>
            )}
          </div>
        </div>

        {/* Human Hand Tiles (Generous, crisp, highly visible) */}
        <div className="flex items-end justify-center gap-2 p-4 bg-slate-950/90 rounded-b-2xl border-b border-x border-slate-700/80 shadow-2xl max-w-full overflow-x-auto">
          {human?.hand_mpsz.map((mpsz, idx) => {
            const isSelected = selectedMpsz === mpsz;
            const isLastDrawn = idx === human.hand_mpsz.length - 1 && human.hand_mpsz.length % 3 === 2;
            return (
              <div
                key={`human-hand-${idx}`}
                className={isLastDrawn ? "ml-4" : ""}
              >
                <Tile
                  mpsz={mpsz}
                  size="lg"
                  selected={isSelected}
                  onClick={() => handleTileClick(mpsz)}
                  disabled={!isHumanTurn}
                />
              </div>
            );
          })}

          {/* Human Open Melds (副露) */}
          {human?.melds && human.melds.length > 0 && (
            <div className="flex items-center gap-2 ml-5 pl-5 border-l-2 border-slate-700">
              {human.melds.map((meld, mIdx) => (
                <div key={`meld-${mIdx}`} className="flex items-center gap-0.5">
                  {meld.mpsz?.map((tileMpsz: string, tIdx: number) => (
                    <Tile key={`meld-tile-${tIdx}`} mpsz={tileMpsz} size="sm" />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ROUND END OVERLAY MODAL */}
      {state.status === "round_end" && state.round_result && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="flex flex-col items-center bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl max-w-md w-full text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              {state.round_result.winner === 0 ? <Trophy className="w-8 h-8" /> : <Award className="w-8 h-8" />}
            </div>

            <h2 className="text-xl font-bold text-white mb-1">
              {state.round_result.type === "ryuukyoku"
                ? "荒野流局"
                : `${state.round_result.winner_name} の和了！`}
            </h2>

            {state.round_result.winning_tile && (
              <div className="flex items-center justify-center gap-2 my-2">
                <span className="text-xs text-slate-400">和了牌:</span>
                <Tile mpsz={state.round_result.winning_mpsz || ""} size="md" />
              </div>
            )}

            {state.round_result.yaku && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 my-2">
                {state.round_result.yaku.map((y, idx) => (
                  <span key={idx} className="px-2.5 py-0.5 bg-slate-800 border border-slate-750 text-amber-300 rounded text-xs font-semibold">
                    {y}
                  </span>
                ))}
              </div>
            )}

            {state.round_result.points && (
              <div className="text-2xl font-black text-amber-400 font-mono my-2">
                +{state.round_result.points.toLocaleString()} 点
              </div>
            )}

            <div className="flex items-center gap-3 mt-4 w-full">
              <button
                type="button"
                onClick={onNextRound}
                className="flex-1 py-3 font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg transition-all text-sm"
              >
                次の局へ進む
              </button>
              <button
                type="button"
                onClick={onNewMatch}
                className="px-4 py-3 font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all text-sm"
              >
                対局やり直し
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
