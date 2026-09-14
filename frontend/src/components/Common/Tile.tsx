import React, { useState } from "react";

interface TileProps {
  mpsz: string;
  label?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  selected?: boolean;
  highlighted?: boolean;
  isDora?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

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
  const [imgError, setImgError] = useState(false);
  const isBack = mpsz === "?" || mpsz === "back";
  const svgPath = isBack ? "/tiles/back.svg" : `/tiles/${mpsz}.svg`;

  // Mahjong standard 3:4 aspect ratio sizes
  const sizeClasses = {
    xs: "w-7 h-10 min-w-[28px] min-h-[40px]",
    sm: "w-9 h-12 min-w-[36px] min-h-[48px]",
    md: "w-11 h-15 min-w-[44px] min-h-[60px]",
    lg: "w-13 h-18 min-w-[52px] min-h-[72px]",
    xl: "w-16 h-22 min-w-[64px] min-h-[88px]",
  }[size];

  if (isBack) {
    return (
      <div
        className={`
          ${sizeClasses}
          relative inline-flex items-center justify-center p-0 select-none
          rounded-md shadow-md bg-amber-900 border border-amber-950 overflow-hidden
        `}
      >
        <img
          src="/tiles/back.svg"
          alt="back"
          className="w-full h-full object-cover pointer-events-none select-none"
        />
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
        relative inline-flex items-center justify-center p-0 select-none
        transition-all duration-150 transform rounded-md
        bg-white shadow-md
        border border-stone-200 border-b-2 border-r-2 border-b-stone-400 border-r-stone-300
        ${selected ? "-translate-y-3.5 ring-2 ring-amber-400 shadow-2xl scale-105" : ""}
        ${highlighted ? "ring-2 ring-cyan-400 shadow-lg animate-pulse scale-105" : ""}
        ${isDora ? "ring-2 ring-red-500 shadow-md" : ""}
        ${
          onClick && !disabled
            ? "cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:brightness-105 active:translate-y-0"
            : "cursor-default"
        }
      `}
    >
      {!imgError ? (
        <img
          src={svgPath}
          alt={label || mpsz}
          className="w-full h-full object-contain pointer-events-none drop-shadow-sm select-none rounded-md"
          loading="eager"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full bg-white text-stone-900 border border-stone-400 rounded-md flex items-center justify-center font-bold text-xs">
          {label || mpsz}
        </div>
      )}

      {/* Dora indicator badge */}
      {isDora && !isBack && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full ring-1 ring-white shadow-sm z-10" />
      )}
    </button>
  );
};
