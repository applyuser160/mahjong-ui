import { useState, useEffect, useRef } from "react";
import type { MatchState } from "./types/mahjong";
import { TableLayout } from "./components/Table/TableLayout";
import { AiHudPanel } from "./components/HUD/AiHudPanel";
import { DrillView } from "./components/Drill/DrillView";
import { ReviewView } from "./components/Review/ReviewView";
import { Gamepad2, BrainCircuit, BarChart2, Wifi, WifiOff, RotateCcw } from "lucide-react";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"match" | "drill" | "review">("match");
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize or reconnect WebSocket
  useEffect(() => {
    const connectWs = () => {
      const ws = new WebSocket("ws://localhost:8000/ws/match");
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.players) {
            setMatchState(data);
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        setConnected(false);
      };
    };

    connectWs();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleDiscard = (tileMpsz: string, declareRiichi: boolean) => {
    if (wsRef.current && connected) {
      wsRef.current.send(
        JSON.stringify({
          type: "discard",
          tile_mpsz: tileMpsz,
          declare_riichi: declareRiichi,
        })
      );
    } else {
      fetch("http://localhost:8000/api/match/discard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tile_mpsz: tileMpsz, declare_riichi: declareRiichi }),
      })
        .then((res) => res.json())
        .then((data) => setMatchState(data));
    }
  };

  const handleCallAction = (action: string) => {
    if (action === "tsumo") {
      if (wsRef.current && connected) {
        wsRef.current.send(JSON.stringify({ type: "tsumo" }));
      } else {
        fetch("http://localhost:8000/api/match/tsumo", { method: "POST" })
          .then((res) => res.json())
          .then((data) => setMatchState(data));
      }
      return;
    }

    if (wsRef.current && connected) {
      wsRef.current.send(
        JSON.stringify({
          type: "call",
          action: action,
        })
      );
    } else {
      fetch("http://localhost:8000/api/match/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: action }),
      })
        .then((res) => res.json())
        .then((data) => setMatchState(data));
    }
  };

  const handleNextRound = () => {
    if (wsRef.current && connected) {
      wsRef.current.send(JSON.stringify({ type: "next_round" }));
    } else {
      fetch("http://localhost:8000/api/match/next_round", { method: "POST" })
        .then((res) => res.json())
        .then((data) => setMatchState(data));
    }
  };

  const handleNewMatch = () => {
    if (wsRef.current && connected) {
      wsRef.current.send(JSON.stringify({ type: "new_match" }));
    } else {
      fetch("http://localhost:8000/api/match/new", { method: "POST" })
        .then((res) => res.json())
        .then((data) => setMatchState(data));
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* HEADER NAVBAR */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-900/95 border-b border-slate-800 z-50 backdrop-blur-md flex-shrink-0 h-14">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center font-serif text-white font-bold text-base shadow-md">
            🀄
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
              MAHJONG AI LAB
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 font-sans font-bold rounded-full border border-emerald-500/30">
                v0.1.0
              </span>
            </h1>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("match")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === "match"
                ? "bg-emerald-600 text-white shadow font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>AI対局 (4人卓)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("drill")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === "drill"
                ? "bg-amber-600 text-white shadow font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>何切るドリル</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("review")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === "review"
                ? "bg-purple-600 text-white shadow font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>悪手検討</span>
          </button>
        </div>

        {/* STATUS & RESET */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            {connected ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden md:inline">リアルタイム同期</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-500">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden md:inline">オフライン</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleNewMatch}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 shadow-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>新対局</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT FULL-SCREEN AREA */}
      <main className="flex-1 p-2 md:p-3 w-full h-[calc(100vh-56px)] overflow-hidden">
        {activeTab === "match" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 w-full h-full items-stretch">
            {/* 4-Player Table Area (3 cols on XL screen: 75% width!) */}
            <div className="xl:col-span-3 w-full h-full flex flex-col">
              {matchState ? (
                <TableLayout
                  state={matchState}
                  onDiscard={handleDiscard}
                  onCallAction={handleCallAction}
                  onNextRound={handleNextRound}
                  onNewMatch={handleNewMatch}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm">卓状態を読み込んでいます...</p>
                </div>
              )}
            </div>

            {/* AI HUD Area (1 col on XL screen: 25% width!) */}
            <div className="xl:col-span-1 w-full h-full overflow-hidden">
              <AiHudPanel hud={matchState?.hud} />
            </div>
          </div>
        )}

        {activeTab === "drill" && (
          <div className="w-full max-w-6xl mx-auto h-full overflow-y-auto py-2">
            <DrillView />
          </div>
        )}

        {activeTab === "review" && (
          <div className="w-full max-w-6xl mx-auto h-full overflow-y-auto py-2">
            <ReviewView />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
