import React from "react";
import type { CallOptions, UserAction } from "../../types/mahjong";

interface ActionPromptProps {
  userActions: UserAction[];
  callOptions?: CallOptions | null;
  onAction: (actionType: string) => void;
  isRiichiSelected: boolean;
  onToggleRiichi: () => void;
}

export const ActionPrompt: React.FC<ActionPromptProps> = ({
  userActions,
  callOptions,
  onAction,
  isRiichiSelected,
  onToggleRiichi,
}) => {
  const hasCallOptions = callOptions && (callOptions.can_ron || callOptions.can_pon || callOptions.can_chi);
  const canTsumo = userActions.some((a) => a.type === "tsumo");
  const canRiichi = userActions.some((a) => a.type === "riichi");

  if (!hasCallOptions && !canTsumo && !canRiichi) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-3 py-2 px-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl animate-fade-in">
      {/* Tsumo Action */}
      {canTsumo && (
        <button
          type="button"
          onClick={() => onAction("tsumo")}
          className="px-5 py-2 font-bold text-white bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 rounded-lg shadow-lg transform hover:scale-105 active:scale-95 transition-all text-sm tracking-wider"
        >
          ツモ (和了)
        </button>
      )}

      {/* Riichi Action */}
      {canRiichi && (
        <button
          type="button"
          onClick={onToggleRiichi}
          className={`px-5 py-2 font-bold rounded-lg shadow-lg transform hover:scale-105 active:scale-95 transition-all text-sm tracking-wider ${
            isRiichiSelected
              ? "bg-amber-400 text-slate-950 ring-2 ring-amber-300 font-extrabold"
              : "bg-gradient-to-r from-amber-600 to-yellow-600 text-white hover:from-amber-500 hover:to-yellow-500"
          }`}
        >
          {isRiichiSelected ? "リーチ宣言中 (牌を選択)" : "リーチ"}
        </button>
      )}

      {/* Ron Call Action */}
      {callOptions?.can_ron && (
        <button
          type="button"
          onClick={() => onAction("ron")}
          className="px-5 py-2 font-bold text-white bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 rounded-lg shadow-lg transform hover:scale-105 active:scale-95 transition-all text-sm tracking-wider animate-bounce"
        >
          ロン (和了)
        </button>
      )}

      {/* Pon Call Action */}
      {callOptions?.can_pon && (
        <button
          type="button"
          onClick={() => onAction("pon")}
          className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transform hover:scale-105 active:scale-95 transition-all text-sm"
        >
          ポン
        </button>
      )}

      {/* Chi Call Action */}
      {callOptions?.can_chi && (
        <button
          type="button"
          onClick={() => onAction("chi")}
          className="px-4 py-2 font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md transform hover:scale-105 active:scale-95 transition-all text-sm"
        >
          チー
        </button>
      )}

      {/* Pass Call Action */}
      {hasCallOptions && (
        <button
          type="button"
          onClick={() => onAction("pass")}
          className="px-4 py-2 font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 shadow-sm transition-all text-sm"
        >
          パス
        </button>
      )}
    </div>
  );
};
