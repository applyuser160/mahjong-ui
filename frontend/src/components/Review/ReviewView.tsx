import { useState, useEffect } from "react";
import type { ReviewSummary } from "../../types/mahjong";
import { Tile } from "../Common/Tile";
import { BarChart3, TrendingDown, Target, AlertOctagon, CheckCircle, RefreshCw } from "lucide-react";

export const ReviewView: React.FC = () => {
  const [review, setReview] = useState<{
    summary: ReviewSummary;
    report: string;
    blunders: any[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReview = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/match/review");
      if (res.ok) {
        const data = await res.json();
        setReview(data);
      }
    } catch (e) {
      console.error("Failed to fetch review data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, []);

  return (
    <div className="flex flex-col max-w-4xl w-full mx-auto p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-wide">終局後 悪手検討 & パフォーマンス分析</h2>
            <p className="text-xs text-slate-400">対局中の全打牌をAI期待値と比較し、損失の大きい分岐を徹底レビュー</p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchReview}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>最新データ取得</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-cyan-400" />
          <p className="text-sm">分析レポートを読み込み中...</p>
        </div>
      ) : review && review.summary.total_turns > 0 ? (
        <div className="flex flex-col gap-6 mt-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex flex-col p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-cyan-400" /> 最善手一致率
              </span>
              <span className="text-2xl font-black text-cyan-400 font-mono mt-1">
                {(review.summary.accuracy_rate * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                {review.summary.optimal_picks_count} / {review.summary.total_turns} 手番
              </span>
            </div>

            <div className="flex flex-col p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> 総EV損失
              </span>
              <span className="text-2xl font-black text-rose-400 font-mono mt-1">
                -{review.summary.total_ev_loss.toFixed(1)}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                平均 -{review.summary.average_ev_loss.toFixed(1)} / 手番
              </span>
            </div>

            <div className="flex flex-col p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5 text-amber-400" /> 悪手 (Blunders)
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono mt-1">
                {review.blunders.length} 回
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                EV損失 50以上の重大悪手
              </span>
            </div>

            <div className="flex flex-col p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 評価ランク
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {review.summary.accuracy_rate >= 0.8
                  ? "S"
                  : review.summary.accuracy_rate >= 0.6
                  ? "A"
                  : review.summary.accuracy_rate >= 0.4
                  ? "B"
                  : "C"}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                AI総合スコア判定
              </span>
            </div>
          </div>

          {/* Formatted Report Block */}
          {review.report && (
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {review.report}
            </div>
          )}

          {/* Blunders Detail List */}
          {review.blunders.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-amber-400" /> 悪手タイムライン分析
              </h3>
              <div className="flex flex-col gap-2">
                {review.blunders.map((b, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between p-3.5 bg-slate-950/70 border border-rose-500/30 rounded-xl gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-slate-800 rounded font-bold font-mono text-slate-300">
                        {b.turn} 巡目
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">あなたの打牌:</span>
                        <Tile mpsz={b.actual_mpsz} size="xs" />
                      </div>
                      <span className="text-slate-500 font-bold">vs</span>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-semibold">AI最善手:</span>
                        <Tile mpsz={b.optimal_mpsz} size="xs" highlighted />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 font-mono">
                      <span className="text-rose-400 font-bold">
                        損失: -{b.ev_loss?.toFixed(1) || 0} EV
                      </span>
                      {b.remaining_count_diff !== undefined && (
                        <span className="text-slate-400 text-[11px]">
                          受入差: -{b.remaining_count_diff}枚
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400">
              <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="text-xs font-semibold">重大な悪手は見当たりませんでした！素晴らしい打牌精度です。</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500">
          <Target className="w-10 h-10 mb-2 stroke-1 text-slate-600" />
          <p className="text-xs font-medium">対局をプレイすると、ここに打牌精度と悪手分析が表示されます</p>
        </div>
      )}
    </div>
  );
};
