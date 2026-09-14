import React from "react";

interface TileProps {
  mpsz: string;
  label?: string;
  size?: "xs" | "sm" | "md" | "lg";
  selected?: boolean;
  highlighted?: boolean;
  isDora?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const TILE_KANJI_MAP: Record<string, { main: string; sub?: string; color: string }> = {
  // Manzu
  "1m": { main: "一", sub: "萬", color: "text-red-600" },
  "2m": { main: "二", sub: "萬", color: "text-red-600" },
  "3m": { main: "三", sub: "萬", color: "text-red-600" },
  "4m": { main: "四", sub: "萬", color: "text-red-600" },
  "5m": { main: "五", sub: "萬", color: "text-red-600" },
  "6m": { main: "六", sub: "萬", color: "text-red-600" },
  "7m": { main: "七", sub: "萬", color: "text-red-600" },
  "8m": { main: "八", sub: "萬", color: "text-red-600" },
  "9m": { main: "九", sub: "萬", color: "text-red-600" },
  // Pinzu
  "1p": { main: "1", sub: "筒", color: "text-blue-600" },
  "2p": { main: "2", sub: "筒", color: "text-blue-600" },
  "3p": { main: "3", sub: "筒", color: "text-blue-600" },
  "4p": { main: "4", sub: "筒", color: "text-blue-600" },
  "5p": { main: "5", sub: "筒", color: "text-blue-600" },
  "6p": { main: "6", sub: "筒", color: "text-blue-600" },
  "7p": { main: "7", sub: "筒", color: "text-blue-600" },
  "8p": { main: "8", sub: "筒", color: "text-blue-600" },
  "9p": { main: "9", sub: "筒", color: "text-blue-600" },
  // Souzu
  "1s": { main: "1", sub: "索", color: "text-emerald-600" },
  "2s": { main: "2", sub: "索", color: "text-emerald-600" },
  "3s": { main: "3", sub: "索", color: "text-emerald-600" },
  "4s": { main: "4", sub: "索", color: "text-emerald-600" },
  "5s": { main: "5", sub: "索", color: "text-emerald-600" },
  "6s": { main: "6", sub: "索", color: "text-emerald-600" },
  "7s": { main: "7", sub: "索", color: "text-emerald-600" },
  "8s": { main: "8", sub: "索", color: "text-emerald-600" },
  "9s": { main: "9", sub: "索", color: "text-emerald-600" },
  // Honors
  "1z": { main: "東", color: "text-slate-900" },
  "2z": { main: "南", color: "text-slate-900" },
  "3z": { main: "西", color: "text-slate-900" },
  "4z": { main: "北", color: "text-slate-900" },
  "5z": { main: "白", color: "text-slate-400" },
  "6z": { main: "發", color: "text-emerald-600" },
  "7z": { main: "中", color: "text-red-600" },
};

export const Tile: React.FC<TileProps> = ({
  mpsz,
  label,
  size = "md",
  selected = false,
  highlighted = false,
  isDora = false,
  onClick,
  disabled = false,
}) => {
  const isBack = mpsz === "?" || mpsz === "back";
  const tileInfo = TILE_KANJI_MAP[mpsz] || {
    main: label || mpsz,
    color: "text-slate-900",
  };

  const sizeClasses = {
    xs: "w-6 h-9 text-xs rounded-sm",
    sm: "w-8 h-12 text-sm rounded",
    md: "w-10 h-14 text-base rounded-md",
    lg: "w-12 h-16 text-lg rounded-md",
  }[size];

  if (isBack) {
    return (
      <div
        className={`${sizeClasses} bg-gradient-to-b from-amber-700 to-amber-900 border border-amber-950 shadow-md flex items-center justify-center select-none cursor-default`}
      >
        <div className="w-full h-full border border-amber-600/30 rounded-sm flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-amber-500/20 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      className={`
        ${sizeClasses}
        relative flex flex-col items-center justify-center font-bold select-none
        transition-all duration-150 transform
        bg-gradient-to-b from-stone-50 via-stone-100 to-stone-200
        border-t border-l border-white border-r-2 border-b-2 border-stone-400
        shadow-sm
        ${selected ? "-translate-y-3.5 ring-2 ring-yellow-400 shadow-xl" : ""}
        ${highlighted ? "ring-2 ring-cyan-400 shadow-md animate-pulse" : ""}
        ${isDora ? "bg-gradient-to-b from-amber-50 to-amber-100" : ""}
        ${
          onClick && !disabled
            ? "cursor-pointer hover:-translate-y-1 hover:shadow-md hover:border-yellow-300"
            : "cursor-default"
        }
      `}
    >
      {/* Top right indicator if Dora */}
      {isDora && (
        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
      )}

      {/* Main Tile Symbol */}
      <span className={`leading-none ${tileInfo.color} font-serif tracking-tight`}>
        {tileInfo.main}
      </span>

      {/* Secondary Kanji for Man/Pin/Sou */}
      {tileInfo.sub && size !== "xs" && (
        <span
          className={`text-[9px] leading-none mt-0.5 ${tileInfo.color} opacity-80 font-sans`}
        >
          {tileInfo.sub}
        </span>
      )}
    </button>
  );
};
