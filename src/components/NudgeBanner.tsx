"use client";

import { useState, useEffect } from "react";
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

/**
 * Provides an ISO 8601 timestamp aligned to the current minute and refreshed once per minute.
 *
 * @returns An ISO 8601 string representing the current time truncated to the start of the current minute (seconds and milliseconds set to zero).
 */
function useMinuteClock() {
  const [now, setNow] = useState(() =>
    new Date(Date.now() - (Date.now() % 60_000)).toISOString()
  );
  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date(Date.now() - (Date.now() % 60_000)).toISOString());
    }, 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * Render a list of active nudges for a baby, with severity styling and actions.
 *
 * Displays a pulsing skeleton UI while nudges are being fetched, renders nothing when there are no active nudges, and otherwise shows each nudge with its severity color, icon, title, body, an optional "Ask Mora" button, and a "Log now" button.
 *
 * @param babyId - Identifier of the baby whose active nudges should be fetched; used to scope the query.
 * @param onOpenMora - Optional callback invoked when the "Ask Mora" button is clicked.
 * @returns A JSX element containing the nudge list styled by severity, a loading skeleton while fetching, or `null` when there are no active nudges.
 */
export default function NudgeBanner({ babyId, onOpenMora }: NudgeBannerProps) {
  const nowIso = useMinuteClock();
  const nudges = useQuery(
    api.nudges.getActiveNudges,
    babyId ? { babyId, now: nowIso } : "skip"
  );

  if (nudges === undefined) {
    return (
      <div className="space-y-2 mb-6">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-2xl border p-4 flex items-start gap-3 border-muted/10 bg-oat/40 animate-pulse"
          >
            <div className="shrink-0 mt-0.5">
              <div className="h-5 w-5 rounded-full bg-muted/20" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded-full bg-muted/10" />
              <div className="h-3 w-64 rounded-full bg-muted/10" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-8 w-20 rounded-lg bg-muted/10" />
              <div className="h-8 w-20 rounded-lg bg-muted/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (nudges.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {nudges.map((nudge, i) => {
        const severity = (nudge.severity && SEVERITY_STYLES[nudge.severity]) ? nudge.severity : "info";
        return (
        <div
          key={`${nudge.type}-${i}`}
          className={`rounded-2xl border p-4 flex items-start gap-3 ${SEVERITY_STYLES[severity]}`}
        >
          <div className={`shrink-0 mt-0.5 ${SEVERITY_ICON_COLORS[severity]}`}>
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
        );
      })}
    </div>
  );
}
