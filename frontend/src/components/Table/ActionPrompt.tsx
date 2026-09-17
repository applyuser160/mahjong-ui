import React, { useState, useEffect } from "react";
import type { CallOptions, UserAction } from "../../types/mahjong";

interface ActionPromptProps {
  userActions: UserAction[];
  callOptions?: CallOptions | null;
  matchStatus?: string;
  onAction: (actionType: string) => void;
  isRiichiSelected: boolean;
  onToggleRiichi: () => void;
}

export const ActionPrompt: React.FC<ActionPromptProps> = ({
  userActions,
  callOptions,
  matchStatus,
  onAction,
  isRiichiSelected,
  onToggleRiichi,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset submitting state whenever match status or call options change
  useEffect(() => {
    setIsSubmitting(false);
  }, [matchStatus, callOptions]);

  const isCallPhase = matchStatus === "waiting_user_call";
  const hasCallOptions = isCallPhase && Boolean(callOptions && (callOptions.can_ron || callOptions.can_pon || callOptions.can_chi));

  const isDiscardPhase = !matchStatus || matchStatus === "waiting_user_discard";
  const canTsumo = isDiscardPhase && userActions.some((a) => a.type === "tsumo");
  const canRiichi = isDiscardPhase && userActions.some((a) => a.type === "riichi");

  if (!hasCallOptions && !canTsumo && !canRiichi) {
    return null;
  }

  const handleActionClick = (action: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onAction(action);
  };

  return (
    <div className="flex items-center justify-center gap-3 py-2 px-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl animate-fade-in">
      {/* Tsumo Action */}
      {canTsumo && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleActionClick("tsumo")}
          className="px-5 py-2 font-bold text-white bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 rounded-lg shadow-lg transform hover:scale-105 active:scale-95 transition-all text-sm tracking-wider"
        >
          ツモ (和了)
        </button>
      )}

      {/* Riichi Action */}
      {canRiichi && (
        <button
          type="button"
          disabled={isSubmitting}
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
      {hasCallOptions && callOptions?.can_ron && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleActionClick("ron")}
          className="px-5 py-2 font-bold text-white bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 disabled:opacity-50 rounded-lg shadow-lg transform hover:scale-105 active:scale-95 transition-all text-sm tracking-wider animate-bounce"
        >
          ロン (和了)
        </button>
      )}

      {/* Pon Call Action */}
      {hasCallOptions && callOptions?.can_pon && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleActionClick("pon")}
          className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg shadow-md transform hover:scale-105 active:scale-95 transition-all text-sm"
        >
          ポン
        </button>
      )}

      {/* Chi Call Action */}
      {hasCallOptions && callOptions?.can_chi && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleActionClick("chi")}
          className="px-4 py-2 font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-lg shadow-md transform hover:scale-105 active:scale-95 transition-all text-sm"
        >
          チー
        </button>
      )}

      {/* Pass Call Action */}
      {hasCallOptions && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleActionClick("pass")}
          className="px-4 py-2 font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg border border-slate-600 shadow-sm transition-all text-sm"
        >
          パス
        </button>
      )}
    </div>
  );
};
