"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import MoraOrb from "@/components/MoraOrb";

interface NudgeBannerProps {
  babyId: any;
  onOpenMora?: () => void;
}

const SEVERITY_STYLES = {
  info: "border-sage/20 bg-sage/5",
  warn: "border-clay/25 bg-clay/5",
  alert: "border-alert-red/25 bg-alert-red/5",
};

const SEVERITY_ICON_COLORS = {
  info: "text-sage",
  warn: "text-clay",
  alert: "text-alert-red",
};

export default function NudgeBanner({ babyId, onOpenMora }: NudgeBannerProps) {
  const nudges = useQuery(api.nudges.getActiveNudges, babyId ? { babyId } : "skip");

  if (!nudges || nudges.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {nudges.map((nudge, i) => (
        <div
          key={`${nudge.type}-${i}`}
          className={`rounded-2xl border p-4 flex items-start gap-3 ${SEVERITY_STYLES[nudge.severity]}`}
        >
          <div className={`shrink-0 mt-0.5 ${SEVERITY_ICON_COLORS[nudge.severity]}`}>
            <span className="material-symbols-outlined text-xl">{nudge.icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-espresso text-sm">{nudge.title}</h4>
            <p className="text-xs text-muted mt-0.5">{nudge.body}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenMora && (
              <button
                type="button"
                onClick={onOpenMora}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/80 border border-muted/10 text-[11px] font-medium text-espresso hover:border-sage/30 transition-colors"
              >
                <MoraOrb size="xs" />
                Ask Mora
              </button>
            )}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("openQuickLogger"))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-espresso text-oat text-[11px] font-bold hover:bg-espresso/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Log now
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
