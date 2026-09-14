import { useState } from "react";
import type { AiHudData } from "../../types/mahjong";
import { Tile } from "../Common/Tile";
import { Sparkles, Brain, Compass, Target, ChevronDown, ChevronUp } from "lucide-react";

interface AiHudPanelProps {
  hud?: AiHudData;
}

export const AiHudPanel: React.FC<AiHudPanelProps> = ({ hud }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!hud || (!hud.best_mpsz && (!hud.candidates || hud.candidates.length === 0))) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-slate-900/90 rounded-2xl border border-slate-800 text-slate-500 h-full min-h-[300px]">
        <Brain className="w-10 h-10 mb-2 stroke-1 text-slate-600 animate-pulse" />
        <p className="text-xs font-medium">手番時にリアルタイムAI推論が動作します</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md w-full max-w-md h-full overflow-y-auto">
      {/* HUD Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">リアルタイム AI HUD</h3>
            <p className="text-[11px] text-slate-400">局面評価 & 最善打牌ガイダンス</p>
          </div>
        </div>
        {hud.current_rank && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-full text-xs font-semibold text-slate-300">
            <span>現在:</span>
            <span className="text-amber-400 font-bold">{hud.current_rank} 位</span>
          </div>
        )}
      </div>

      {/* TOP RECOMMENDATION CARD */}
      <div className="flex flex-col gap-2 p-3.5 bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/30 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
            <Brain className="w-3.5 h-3.5" /> AI 推奨最善打牌
          </span>
          {hud.best_placement_ev !== undefined && (
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
              着順EV: {hud.best_placement_ev.toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1">
          {hud.best_mpsz && (
            <div className="p-1 bg-slate-950/80 rounded-lg border border-cyan-400/40 shadow-inner">
              <Tile mpsz={hud.best_mpsz} size="md" highlighted />
            </div>
          )}
          <div className="flex flex-col justify-center text-xs">
            <span className="font-bold text-white text-sm">
              [{hud.best_tile || hud.best_mpsz}] 切り
            </span>
            <span className="text-slate-300 text-[11px] mt-0.5 line-clamp-2">
              {hud.best_note || "最大受入枚数と高打点・速度バランスの最善手"}
            </span>
          </div>
        </div>
      </div>

      {/* ORASU CONDITIONS (If South 4) */}
      {hud.is_orasu && hud.orasu_conditions && hud.orasu_conditions.length > 0 && (
        <div className="flex flex-col gap-1.5 p-3 bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/40 rounded-xl">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
            <Target className="w-3.5 h-3.5" /> オーラス逆転条件
          </div>
          <div className="flex flex-col gap-1 text-[11px] text-slate-300 mt-1">
            {hud.orasu_conditions.map((cond, idx) => (
              <div key={idx} className="p-1.5 bg-slate-950/70 rounded border border-amber-500/20">
                <span className="font-bold text-amber-300">{cond.target_rank}位浮上: </span>
                <span>{cond.summary}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CANDIDATES COMPARISON TABLE */}
      {hud.candidates && hud.candidates.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-slate-400" /> 打牌候補の比較 (上位{Math.min(4, hud.candidates.length)}手)
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {isExpanded && (
            <div className="flex flex-col gap-1.5">
              {hud.candidates.slice(0, 4).map((cand, idx) => {
                const isTop = idx === 0;
                return (
                  <div
                    key={`${cand.mpsz}-${idx}`}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
                      isTop
                        ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-200"
                        : "bg-slate-950/40 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Tile mpsz={cand.mpsz} size="xs" />
                      <div className="flex flex-col">
                        <span className="font-bold font-sans">
                          {cand.discard_tile}
                          {isTop && <span className="ml-1 text-[10px] text-cyan-400 font-normal">[最善]</span>}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {cand.shanten_after === 0 ? "聴牌" : `${cand.shanten_after}向聴`} | 受入: {cand.remaining_count}枚
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-xs text-amber-300">
                        {cand.expected_score > 0 ? `${Math.round(cand.expected_score)}点` : "-"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        安全度: {cand.is_safe ? "安牌" : `${Math.round((1 - cand.risk_score) * 100)}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
