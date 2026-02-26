"use client";

import { cn } from "@/lib/utils";

type OrbSize = "xs" | "sm" | "md" | "lg" | "xl";
type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface MoraOrbProps {
  size?: OrbSize;
  state?: OrbState;
  className?: string;
}

const sizes: Record<OrbSize, { outer: string; inner: string; glow: string; dot: string }> = {
  xs: { outer: "h-6 w-6", inner: "h-3.5 w-3.5", glow: "h-5 w-5", dot: "h-1 w-1" },
  sm: { outer: "h-8 w-8", inner: "h-5 w-5", glow: "h-7 w-7", dot: "h-1.5 w-1.5" },
  md: { outer: "h-10 w-10", inner: "h-6 w-6", glow: "h-9 w-9", dot: "h-2 w-2" },
  lg: { outer: "h-14 w-14", inner: "h-8 w-8", glow: "h-12 w-12", dot: "h-2.5 w-2.5" },
  xl: { outer: "h-20 w-20", inner: "h-12 w-12", glow: "h-18 w-18", dot: "h-3 w-3" },
};

export default function MoraOrb({ size = "md", state = "idle", className }: MoraOrbProps) {
  const s = sizes[size];

  return (
    <div className={cn("relative flex items-center justify-center", s.outer, className)}>
      {/* Outer glow ring */}
      <div
        className={cn(
          "absolute rounded-full",
          s.glow,
          state === "idle" && "bg-gradient-to-br from-sage/20 to-clay/10",
          state === "listening" && "bg-gradient-to-br from-sage/30 to-sky-200/30 animate-pulse",
          state === "thinking" && "bg-gradient-to-br from-sage/25 to-violet-200/25 animate-spin-slow",
          state === "speaking" && "bg-gradient-to-br from-sage/30 to-amber-200/20 animate-pulse",
        )}
      />

      {/* Middle soft ring */}
      <div
        className={cn(
          "absolute rounded-full bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm border border-white/60 shadow-sm",
          s.outer,
        )}
      />

      {/* Core orb */}
      <div
        className={cn(
          "relative rounded-full shadow-inner flex items-center justify-center",
          s.inner,
          "bg-gradient-to-br from-sage/60 via-sage/40 to-emerald-200/50",
          state === "thinking" && "animate-breathe",
          state === "speaking" && "animate-breathe",
        )}
      >
        {/* Inner highlight dot */}
        <div
          className={cn(
            "rounded-full bg-white/70 shadow-sm",
            s.dot,
            state === "listening" && "animate-ping-soft",
          )}
        />
      </div>

      {/* Orbiting particle (thinking) */}
      {state === "thinking" && (
        <div className="absolute inset-0 animate-orbit">
          <div className={cn("absolute top-0 left-1/2 -translate-x-1/2 rounded-full bg-sage/50", s.dot)} />
        </div>
      )}
    </div>
  );
}
