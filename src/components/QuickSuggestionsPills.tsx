"use client";

type Suggestion = {
  id: string;
  label: string;
  icon: string;
  color: string;
  prefill: {
    view: "feed" | "diaper" | "sleep" | "meds";
    feedSubType?: "bottle" | "breast";
    volume?: number;
    duration?: number;
    diaperKind?: "wet" | "dirty" | "dry" | "mixed";
    medName?: string;
    isSleepingNow?: boolean;
  };
};

function roundToPreset(ml: number): number {
  const presets = [60, 90, 120, 150, 180, 210, 240];
  return presets.reduce((prev, curr) =>
    Math.abs(curr - ml) < Math.abs(prev - ml) ? curr : prev
  );
}

function getSuggestions({
  dailyAggregates,
  rangeAggregates,
  lastFeed,
  lastDiaper,
  lastMed,
  isSleeping,
}: {
  dailyAggregates?: DailyAgg | null;
  rangeAggregates?: Record<string, DailyAgg> | null;
  lastFeed?: { type: string; payload?: { amountMl?: number; durationMin?: number } };
  lastDiaper?: { payload?: { kind?: string } };
  lastMed?: { payload?: { medicineName?: string } };
  isSleeping: boolean;
}): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Avg bottle ml from week or today
  let avgBottleMl = 120;
  if (rangeAggregates && Object.keys(rangeAggregates).length > 0) {
    let totalMl = 0;
    let totalCount = 0;
    for (const day of Object.values(rangeAggregates)) {
      totalMl += day.feeds?.totalMl ?? 0;
      totalCount += day.feeds?.count ?? 0;
    }
    if (totalCount > 0) {
      avgBottleMl = roundToPreset(Math.round(totalMl / totalCount));
    }
  } else if (dailyAggregates?.feeds?.count && dailyAggregates.feeds.count > 0) {
    avgBottleMl = roundToPreset(
      Math.round(dailyAggregates.feeds.totalMl / dailyAggregates.feeds.count)
    );
  } else if (lastFeed?.type === "FEED_BOTTLE" && lastFeed.payload?.amountMl) {
    avgBottleMl = roundToPreset(lastFeed.payload.amountMl);
  }

  // Bottle feed suggestion
  suggestions.push({
    id: "bottle",
    label: `Bottle ${avgBottleMl}ml`,
    icon: "water_drop",
    color: "sage",
    prefill: {
      view: "feed",
      feedSubType: "bottle",
      volume: avgBottleMl,
    },
  });

  // Most common diaper kind from today or week
  let diaperKind: "wet" | "dirty" | "dry" | "mixed" = "wet";
  const diapers = dailyAggregates?.diapers ?? { wet: 0, dirty: 0, dry: 0, mixed: 0 };
  const counts = [
    { k: "wet" as const, v: diapers.wet ?? 0 },
    { k: "dirty" as const, v: diapers.dirty ?? 0 },
    { k: "dry" as const, v: diapers.dry ?? 0 },
    { k: "mixed" as const, v: diapers.mixed ?? 0 },
  ];
  const top = counts.reduce((a, b) => (b.v > a.v ? b : a), counts[0]);
  if (top.v > 0) diaperKind = top.k;
  else if (lastDiaper?.payload?.kind && ["wet", "dirty", "dry", "mixed"].includes(lastDiaper.payload.kind)) {
    diaperKind = lastDiaper.payload.kind as "wet" | "dirty" | "dry" | "mixed";
  }

  const diaperLabel = diaperKind.charAt(0).toUpperCase() + diaperKind.slice(1);
  suggestions.push({
    id: "diaper",
    label: diaperLabel,
    icon: "baby_changing_station",
    color: "clay",
    prefill: {
      view: "diaper",
      diaperKind,
    },
  });

  // Sleep: Start or End based on current state
  suggestions.push({
    id: "sleep",
    label: isSleeping ? "End sleep" : "Start sleep",
    icon: "bedtime",
    color: "night",
    prefill: {
      view: "sleep",
      isSleepingNow: !isSleeping,
    },
  });

  // Medicine if we have a recent one
  const medName = lastMed?.payload?.medicineName;
  if (medName?.trim()) {
    suggestions.push({
      id: "med",
      label: medName.trim(),
      icon: "medication",
      color: "alert-red",
      prefill: {
        view: "meds",
        medName: medName.trim(),
      },
    });
  }

  return suggestions;
}

function openQuickLoggerWithPrefill(prefill: Suggestion["prefill"]) {
  window.dispatchEvent(
    new CustomEvent("openQuickLogger", { detail: { prefill } })
  );
}

type DailyAgg = {
  feeds?: { count: number; totalMl: number };
  diapers?: { wet: number; dirty: number; dry: number; mixed: number };
};

interface QuickSuggestionsPillsProps {
  babyId: string | null;
  lastEvents?: Record<string, unknown>;
  dailyAggregates?: DailyAgg | null;
  rangeAggregates?: Record<string, DailyAgg> | null;
  lastFeed?: { type: string; payload?: { amountMl?: number; durationMin?: number } };
  lastDiaper?: { payload?: { kind?: string } };
  lastMed?: { payload?: { medicineName?: string } };
  isSleeping: boolean;
}

export default function QuickSuggestionsPills({
  dailyAggregates,
  rangeAggregates,
  lastFeed,
  lastDiaper,
  lastMed,
  isSleeping,
}: QuickSuggestionsPillsProps) {
  const suggestions = getSuggestions({
    dailyAggregates,
    rangeAggregates,
    lastFeed,
    lastDiaper,
    lastMed,
    isSleeping,
  });

  if (suggestions.length === 0) return null;

  const colorClasses: Record<string, { icon: string; hover: string }> = {
    sage: { icon: "text-sage", hover: "hover:border-sage/30" },
    clay: { icon: "text-clay", hover: "hover:border-clay/30" },
    night: { icon: "text-night", hover: "hover:border-night/30" },
    "alert-red": { icon: "text-alert-red", hover: "hover:border-alert-red/30" },
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-muted uppercase tracking-wider px-1">
        Quick add
      </h3>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => {
          const cc = colorClasses[s.color] ?? colorClasses.sage;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => openQuickLoggerWithPrefill(s.prefill)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all hover:scale-[1.02] active:scale-[0.98] bg-white border-muted/10 ${cc.hover} shadow-sm`}
            >
              <span className={`material-symbols-outlined ${cc.icon} text-[18px]`}>
                {s.icon}
              </span>
              <span className="text-espresso">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
