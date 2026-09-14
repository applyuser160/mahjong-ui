import { useState, useEffect } from "react";
import type { DrillProblem } from "../../types/mahjong";
import { Tile } from "../Common/Tile";
import { HelpCircle, CheckCircle2, XCircle, AlertTriangle, ArrowRight, RefreshCw, Award } from "lucide-react";

export const DrillView: React.FC = () => {
  const [problem, setProblem] = useState<DrillProblem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMpsz, setSelectedMpsz] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    isBest: boolean;
    diff: number;
    message: string;
  } | null>(null);
  const [stats, setStats] = useState<{ total: number; correct: number }>({
    total: 0,
    correct: 0,
  });

  const fetchNewProblem = async () => {
    setLoading(true);
    setSelectedMpsz(null);
    setFeedback(null);
    try {
      const res = await fetch("http://localhost:8000/api/drill/problem");
      if (res.ok) {
        const data = await res.json();
        setProblem(data);
      }
    } catch (e) {
      console.error("Failed to fetch drill problem", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewProblem();
  }, []);

  const handleSelectTile = async (mpsz: string) => {
    if (!problem || feedback) return;
    setSelectedMpsz(mpsz);

    try {
      const res = await fetch("http://localhost:8000/api/drill/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_mpsz: mpsz,
          problem_candidates: problem.candidates,
          best_mpsz: problem.best_mpsz,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFeedback({
          isBest: data.is_best,
          diff: data.ev_difference,
          message: data.feedback_message,
        });
        setStats((prev) => ({
          total: prev.total + 1,
          correct: prev.correct + (data.is_best ? 1 : 0),
        }));
      }
    } catch (e) {
      console.error("Failed to check answer", e);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-4xl w-full mx-auto p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md">
      {/* Header & Stats */}
      <div className="flex items-center justify-between w-full pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-wide">何切るドリル</h2>
            <p className="text-xs text-slate-400">実戦配牌からAIが生成する牌効率・打点最善手トレーニング</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Award className="w-4 h-4 text-amber-400" />
            <span>正解率:</span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
            </span>
          </div>
          <div className="text-slate-500">
            ({stats.correct} / {stats.total} 問)
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-cyan-400" />
          <p className="text-sm font-medium">問題を生成中...</p>
        </div>
      ) : problem ? (
        <div className="flex flex-col items-center w-full mt-6 gap-6">
          {/* Situation Context */}
          <div className="flex items-center justify-between w-full px-6 py-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-400 font-medium">巡目: <strong className="text-white">{problem.turn_number}巡目</strong></span>
              <span className="text-slate-400 font-medium">東風戦・平場</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 font-medium">ドラ表示牌:</span>
              <Tile mpsz={problem.dora_mpsz} size="sm" isDora />
            </div>
          </div>

          {/* Hand Display */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">
              {feedback ? "選択した打牌と解説をご確認ください" : "切る牌を1枚クリックしてください"}
            </span>
            <div className="flex items-center gap-1.5 p-4 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl shadow-inner overflow-x-auto max-w-full">
              {problem.mpsz.map((mpsz, idx) => (
                <Tile
                  key={`drill-${idx}`}
                  mpsz={mpsz}
                  size="lg"
                  selected={selectedMpsz === mpsz}
                  onClick={() => handleSelectTile(mpsz)}
                  disabled={feedback !== null}
                />
              ))}
            </div>
          </div>

          {/* Feedback & Evaluation Result */}
          {feedback && (
            <div className="flex flex-col w-full gap-4 animate-fade-in">
              {/* Alert Banner */}
              <div
                className={`flex items-start gap-3 p-4 rounded-xl border ${
                  feedback.isBest
                    ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-200"
                    : feedback.diff < 100
                    ? "bg-amber-950/60 border-amber-500/50 text-amber-200"
                    : "bg-rose-950/60 border-rose-500/50 text-rose-200"
                }`}
              >
                {feedback.isBest ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : feedback.diff < 100 ? (
                  <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex flex-col gap-1">
                  <h4 className="font-bold text-base">{feedback.message}</h4>
                  <p className="text-xs opacity-90 leading-relaxed mt-1">
                    {problem.rationale}
                  </p>
                </div>
              </div>

              {/* Candidate Comparison */}
              <div className="flex flex-col gap-2 p-4 bg-slate-950/80 rounded-xl border border-slate-800">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  打牌候補ランキング (期待値順)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                  {problem.candidates.slice(0, 6).map((cand, idx) => {
                    const isSelected = cand.mpsz === selectedMpsz;
                    const isTop = cand.mpsz === problem.best_mpsz;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                          isTop
                            ? "bg-cyan-950/50 border-cyan-500/50 text-white"
                            : isSelected
                            ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
                            : "bg-slate-900/60 border-slate-800 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Tile mpsz={cand.mpsz} size="xs" />
                          <div className="flex flex-col">
                            <span className="font-bold">
                              {cand.discard_tile}
                              {isTop && <span className="ml-1 text-[10px] text-cyan-400 font-bold">[最善手]</span>}
                              {isSelected && !isTop && <span className="ml-1 text-[10px] text-amber-400">[選択]</span>}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {cand.shanten_after === 0 ? "聴牌" : `${cand.shanten_after}向聴`} | 受入: {cand.remaining_count}枚
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end font-mono">
                          <span className="font-bold text-amber-300">EV: {cand.ev.toFixed(1)}</span>
                          <span className="text-[10px] text-slate-400">
                            {cand.expected_score > 0 ? `${Math.round(cand.expected_score)}点` : "-"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Next Question Button */}
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={fetchNewProblem}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-sm"
                >
                  <span>次の問題へ進む</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
