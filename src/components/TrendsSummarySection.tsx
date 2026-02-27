"use client";

import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";

export type TrendMetricId =
  | "feed-sessions"
  | "amount-bottlefed"
  | "bottle-size"
  | "time-btwn-feedings"
  | "total-diapers"
  | "total-sleep"
  | "sleep-sessions"
  | "med-adherence"
  | "med-taken-skipped";

interface TrendDelta {
  value: number;
  unit: string;
  direction: "up" | "down";
  label?: string;
}

interface MetricRowProps {
  icon: string;
  title: string;
  value: string;
  subValue?: string;
  delta?: TrendDelta;
  onClick?: () => void;
}

function MetricRow({ icon, title, value, subValue, delta, onClick }: MetricRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-oat/30 rounded-xl px-3 -mx-3"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="material-symbols-outlined shrink-0 text-xl text-sage">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium text-espresso">{title}</div>
          <div className="text-xs text-muted mt-0.5">{value}</div>
          {subValue && (
            <div className="flex items-center gap-1 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-sage shrink-0" />
              <span className="text-[11px] text-muted">{subValue}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {delta && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold",
              delta.direction === "up"
                ? "bg-sage/20 text-sage"
                : "bg-clay/20 text-clay"
            )}
          >
            {delta.direction === "up" ? "↑" : "↓"} {delta.value}
            {delta.unit}
          </span>
        )}
        <span className="material-symbols-outlined text-base text-muted">
          chevron_right
        </span>
      </div>
    </button>
  );
}

interface FeedSection {
  sessions: number;
  totalMl: number;
  bottleSizeAvg: number;
  avgGapMin: number;
  subBreakdown?: string;
}

interface DiaperSection {
  total: number;
  subBreakdown?: string;
}

interface SleepSection {
  totalMin: number;
  sessions: number;
}

interface HealthSection {
  adherence: number;
  taken: number;
  skipped: number;
}

interface TrendsSummarySectionProps {
  feed: FeedSection | null;
  diaper: DiaperSection | null;
  sleep: SleepSection | null;
  health: HealthSection | null;
  feedDelta?: { sessions?: number; ml?: number; bottleSize?: number; gapMin?: number };
  diaperDelta?: number;
  sleepDelta?: { totalMin?: number; sessions?: number };
  healthDelta?: { adherence?: number };
  onMetricClick?: (metric: TrendMetricId) => void;
}

export function TrendsSummarySection({
  feed,
  diaper,
  sleep,
  health,
  feedDelta,
  diaperDelta,
  sleepDelta,
  healthDelta,
  onMetricClick,
}: TrendsSummarySectionProps) {
  return (
    <div className="space-y-6">
      {/* Feed */}
      <section>
        <h3 className="text-lg font-serif font-bold text-espresso mb-2">Feed</h3>
        <div className="space-y-0">
          <MetricRow
            icon="restaurant"
            title="Feed Sessions"
            value={
              feed
                ? `${feed.sessions} session${feed.sessions !== 1 ? "s" : ""}${feed.subBreakdown ? " per day" : ""}`
                : "—"
            }
            subValue={feed?.subBreakdown}
            delta={
              feedDelta?.sessions != null && feedDelta.sessions !== 0
                ? {
                    value: Math.abs(feedDelta.sessions),
                    unit: "",
                    direction: feedDelta.sessions > 0 ? "up" : "down",
                  }
                : undefined
            }
            onClick={() => onMetricClick?.("feed-sessions")}
          />
          <MetricRow
            icon="water_drop"
            title="Amount Bottlefed"
            value={feed ? `${feed.totalMl} mL` : "—"}
            subValue={feed?.subBreakdown}
            delta={
              feedDelta?.ml != null && feedDelta.ml !== 0
                ? {
                    value: Math.abs(feedDelta.ml),
                    unit: " mL",
                    direction: feedDelta.ml > 0 ? "up" : "down",
                  }
                : undefined
            }
            onClick={() => onMetricClick?.("amount-bottlefed")}
          />
          <MetricRow
            icon="local_drink"
            title="Bottle Size"
            value={feed ? `${feed.bottleSizeAvg} mL average` : "—"}
            delta={
              feedDelta?.bottleSize != null && feedDelta.bottleSize !== 0
                ? {
                    value: Math.abs(feedDelta.bottleSize),
                    unit: " mL",
                    direction: feedDelta.bottleSize > 0 ? "up" : "down",
                  }
                : undefined
            }
            onClick={() => onMetricClick?.("bottle-size")}
          />
          <MetricRow
            icon="schedule"
            title="Time Btwn Feedings"
            value={feed ? `${formatDuration(feed.avgGapMin)} average` : "—"}
            delta={
              feedDelta?.gapMin != null && feedDelta.gapMin !== 0
                ? {
                    value: Math.abs(feedDelta.gapMin),
                    unit: "m",
                    direction: feedDelta.gapMin > 0 ? "down" : "up",
                  }
                : undefined
            }
            onClick={() => onMetricClick?.("time-btwn-feedings")}
          />
        </div>
      </section>

      {/* Diaper */}
      <section>
        <h3 className="text-lg font-serif font-bold text-espresso mb-2">Diaper</h3>
        <div className="space-y-0">
          <MetricRow
            icon="baby_changing_station"
            title="Total Diapers"
            value={diaper ? `${diaper.total} diaper${diaper.total !== 1 ? "s" : ""}${diaper.subBreakdown ? " per day" : ""}` : "—"}
            subValue={diaper?.subBreakdown}
            delta={
              diaperDelta != null && diaperDelta !== 0
                ? {
                    value: Math.abs(diaperDelta),
                    unit: "",
                    direction: diaperDelta > 0 ? "up" : "down",
                  }
                : undefined
            }
            onClick={() => onMetricClick?.("total-diapers")}
          />
        </div>
      </section>

      {/* Sleep */}
      <section>
        <h3 className="text-lg font-serif font-bold text-espresso mb-2">Sleep</h3>
        <div className="space-y-0">
          <MetricRow
            icon="bedtime"
            title="Total Sleep"
            value={sleep ? formatDuration(sleep.totalMin) : "—"}
            subValue={sleep ? `${sleep.sessions} sessions` : undefined}
            delta={
              sleepDelta?.totalMin != null && sleepDelta.totalMin !== 0
                ? {
                    value: Math.abs(sleepDelta.totalMin),
                    unit: "m",
                    direction: sleepDelta.totalMin > 0 ? "up" : "down",
                  }
                : undefined
            }
            onClick={() => onMetricClick?.("total-sleep")}
          />
        </div>
      </section>

      {/* Health */}
      <section>
        <h3 className="text-lg font-serif font-bold text-espresso mb-2">Health</h3>
        <div className="space-y-0">
          <MetricRow
            icon="medication"
            title="Medicine Adherence"
            value={health ? `${health.adherence}%` : "—"}
            subValue={
              health
                ? `${health.taken} taken, ${health.skipped} skipped`
                : undefined
            }
            delta={
              healthDelta?.adherence != null && healthDelta.adherence !== 0
                ? {
                    value: Math.abs(healthDelta.adherence),
                    unit: "%",
                    direction: healthDelta.adherence > 0 ? "up" : "down",
                  }
                : undefined
            }
            onClick={() => onMetricClick?.("med-adherence")}
          />
        </div>
      </section>
    </div>
  );
}

export default TrendsSummarySection;
