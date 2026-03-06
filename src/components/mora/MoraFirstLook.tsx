"use client";

import { useEffect, useRef, useState } from "react";
import { ThreadPrimitive } from "@assistant-ui/react";
import { motion } from "motion/react";
import type { QuickLogPrefill } from "@/components/QuickLoggerDrawer";
import MoraOrb from "@/components/MoraOrb";
import { Button } from "@/components/ui/button";

type BriefAction = {
  id: string;
  label: string;
  description: string;
  prefill: QuickLogPrefill;
};

type BriefChip = {
  label: string;
  value: string;
  accent: "sage" | "night" | "clay" | "alert-red";
};

type MoraBrief = {
  babyId: string | null;
  headline: string;
  body: string;
  statusTone: "calm" | "gentle" | "alert";
  primaryAction: BriefAction;
  suggestions: string[];
  chips: BriefChip[];
};

const TONE_STYLES = {
  calm: {
    shell: "border-black/5 bg-[radial-gradient(circle_at_top,_rgba(124,154,130,0.18),_rgba(255,255,255,0.92)_52%)]",
    pill: "bg-sage/12 text-sage border-sage/20",
  },
  gentle: {
    shell: "border-clay/15 bg-[radial-gradient(circle_at_top,_rgba(196,164,132,0.2),_rgba(255,255,255,0.94)_56%)]",
    pill: "bg-clay/12 text-clay border-clay/20",
  },
  alert: {
    shell: "border-alert-red/15 bg-[radial-gradient(circle_at_top,_rgba(229,115,115,0.16),_rgba(255,255,255,0.95)_56%)]",
    pill: "bg-alert-red/10 text-alert-red border-alert-red/20",
  },
} as const;

const CHIP_STYLES = {
  sage: "text-sage",
  night: "text-night",
  clay: "text-clay",
  "alert-red": "text-alert-red",
} as const;

export default function MoraFirstLook({
  pageLabel,
  babyId,
}: {
  pageLabel: string;
  babyId?: string | null;
}) {
  const [brief, setBrief] = useState<MoraBrief | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const viewedRef = useRef(false);

  const safeTrackMetric = (payload: {
    babyId?: string;
    eventName: string;
    pageLabel: string;
    actionId?: string;
  }) => {
    void fetch("/api/mora/metric", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Metrics are non-critical; avoid interrupting Mora if Convex code is not yet deployed.
    });
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/mora/brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ babyId, pageLabel }),
        });

        if (!response.ok) throw new Error("Failed to load Mora brief");
        const nextBrief = (await response.json()) as MoraBrief;

        if (!cancelled) {
          setBrief(nextBrief);
          setIsLoading(false);
          if (!viewedRef.current) {
            viewedRef.current = true;
            safeTrackMetric({
              babyId: nextBrief.babyId ?? undefined,
              eventName: "mora_first_look_viewed",
              pageLabel,
            });
          }
        }
      } catch {
        if (!cancelled) {
          setBrief(null);
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [babyId, pageLabel]);

  const handlePrimaryAction = () => {
    if (!brief?.primaryAction) return;
    window.dispatchEvent(
      new CustomEvent("openQuickLogger", {
        detail: { prefill: brief.primaryAction.prefill },
      })
    );
    safeTrackMetric({
      babyId: brief.babyId ?? undefined,
      eventName: "mora_first_look_action_clicked",
      pageLabel,
      actionId: brief.primaryAction.id,
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-[28px] border border-black/5 bg-white/85 p-4 shadow-[0_16px_50px_-30px_rgba(60,40,20,0.35)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-black/5" />
          <div className="space-y-2">
            <div className="h-3 w-28 rounded-full bg-black/5" />
            <div className="h-3 w-44 rounded-full bg-black/5" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-6 w-3/4 rounded-full bg-black/5" />
          <div className="h-4 w-full rounded-full bg-black/5" />
          <div className="h-4 w-5/6 rounded-full bg-black/5" />
        </div>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="rounded-[28px] border border-black/5 bg-white/90 p-4">
        <div className="mb-3 flex items-center gap-2">
          <MoraOrb size="xs" state="idle" />
          <span className="text-[13px] font-medium text-espresso">Mora</span>
        </div>
        <p className="text-[13px] text-muted leading-relaxed">
          Ask about feeds, sleep, diapers, reminders, or trends. I&apos;ll keep the next step clear.
        </p>
      </div>
    );
  }

  const tone = TONE_STYLES[brief.statusTone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={`overflow-hidden rounded-[28px] border p-4 shadow-[0_18px_55px_-30px_rgba(60,40,20,0.35)] ${tone.shell}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm shadow-black/5">
            <MoraOrb size="xs" state="idle" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              First Look
            </div>
            <div className="text-[12px] text-muted">What matters now, before you type</div>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${tone.pill}`}>
          {brief.statusTone === "alert" ? "Needs attention" : brief.statusTone === "gentle" ? "Worth a look" : "On track"}
        </span>
      </div>

      <div className="mb-4">
        <h3 className="max-w-[22rem] text-[22px] font-semibold leading-tight tracking-[-0.03em] text-espresso">
          {brief.headline}
        </h3>
        <p className="mt-2 max-w-[28rem] text-[13px] leading-relaxed text-muted">
          {brief.body}
        </p>
      </div>

      {brief.chips.length > 0 ? (
        <div className="mb-4 grid grid-cols-2 gap-2">
          {brief.chips.map((chip) => (
            <div key={chip.label} className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2 shadow-sm shadow-black/5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                {chip.label}
              </div>
              <div className={`mt-1 text-[13px] font-semibold ${CHIP_STYLES[chip.accent]}`}>
                {chip.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-[22px] border border-black/5 bg-white/88 p-3 shadow-sm shadow-black/5">
        <div className="mb-3">
          <div className="text-[15px] font-semibold tracking-[-0.02em] text-espresso">
            {brief.primaryAction.label}
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            {brief.primaryAction.description}
          </p>
        </div>

        <Button
          type="button"
          onClick={handlePrimaryAction}
          className="h-10 w-full rounded-2xl bg-espresso text-oat shadow-lg shadow-espresso/10 hover:bg-espresso/92"
        >
          <span className="material-symbols-outlined text-[18px]">bolt</span>
          {brief.primaryAction.label}
        </Button>
      </div>

      {brief.suggestions.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {brief.suggestions.map((prompt) => (
            <ThreadPrimitive.Suggestion key={prompt} prompt={prompt} autoSend asChild>
              <button
                type="button"
                className="rounded-full border border-black/5 bg-white/75 px-3 py-1.5 text-[11px] font-medium text-muted transition-colors hover:bg-white hover:text-espresso"
              >
                {prompt}
              </button>
            </ThreadPrimitive.Suggestion>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}
