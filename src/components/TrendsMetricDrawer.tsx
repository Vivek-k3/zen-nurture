"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { formatTime, formatDuration } from "@/lib/time";
import { EVENT_TYPE_ICONS } from "@/lib/constants";
import TrendsCalendar from "@/components/TrendsCalendar";
import type { TrendMetricId } from "@/components/TrendsSummarySection";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const METRIC_CONFIG: Record<
  TrendMetricId,
  { title: string; icon: string; eventTypes: string[]; chartField: string; chartLabel: string }
> = {
  "feed-sessions": {
    title: "Feed Sessions",
    icon: "restaurant",
    eventTypes: ["feed"],
    chartField: "feedCount",
    chartLabel: "sessions",
  },
  "amount-bottlefed": {
    title: "Amount Bottlefed",
    icon: "water_drop",
    eventTypes: ["feed"],
    chartField: "feedMl",
    chartLabel: "mL",
  },
  "bottle-size": {
    title: "Bottle Size",
    icon: "local_drink",
    eventTypes: ["feed"],
    chartField: "feedMl",
    chartLabel: "mL avg",
  },
  "time-btwn-feedings": {
    title: "Time Btwn Feedings",
    icon: "schedule",
    eventTypes: ["feed"],
    chartField: "feedCount",
    chartLabel: "sessions",
  },
  "total-diapers": {
    title: "Total Diapers",
    icon: "baby_changing_station",
    eventTypes: ["diaper"],
    chartField: "diaperCount",
    chartLabel: "diapers",
  },
  "total-sleep": {
    title: "Total Sleep",
    icon: "bedtime",
    eventTypes: ["sleep"],
    chartField: "sleepHours",
    chartLabel: "hours",
  },
  "sleep-sessions": {
    title: "Sleep Sessions",
    icon: "bedtime",
    eventTypes: ["sleep"],
    chartField: "sleepHours",
    chartLabel: "hours",
  },
  "med-adherence": {
    title: "Medicine Adherence",
    icon: "medication",
    eventTypes: ["health"],
    chartField: "feedCount",
    chartLabel: "",
  },
  "med-taken-skipped": {
    title: "Medicine Taken / Skipped",
    icon: "medication",
    eventTypes: ["health"],
    chartField: "feedCount",
    chartLabel: "",
  },
};

function getEventDetail(type: string, payload: Record<string, unknown>): string | null {
  switch (type) {
    case "FEED_BOTTLE": {
      const parts = [];
      if (payload.amountMl) parts.push(`${payload.amountMl}ml`);
      if (payload.formulaName) parts.push(String(payload.formulaName));
      else if (payload.contentType === "breast_milk") parts.push("Breast Milk");
      else if (payload.contentType === "cow_milk") parts.push("Cow Milk");
      return parts.length ? parts.join(" · ") : null;
    }
    case "FEED_BREAST": {
      const parts = [];
      if (payload.durationMin) parts.push(`${payload.durationMin}min`);
      if (payload.side) parts.push(String(payload.side));
      return parts.length ? parts.join(" · ") : null;
    }
    case "PUMP":
      return payload.amountMl ? `${payload.amountMl}ml` : null;
    case "DIAPER": {
      const parts = [];
      if (payload.kind) parts.push(String(payload.kind));
      if (payload.texture) parts.push(String(payload.texture));
      if (payload.color) parts.push(String(payload.color));
      return parts.length ? parts.join(" · ") : null;
    }
    case "SLEEP": {
      if (!payload.startTs || !payload.endTs) return "In progress";
      const start = new Date(payload.startTs as string).getTime();
      const end = new Date(payload.endTs as string).getTime();
      const min = Math.floor((end - start) / 60000);
      return formatDuration(min);
    }
    case "MED_DOSE":
      return payload.medicineName ? String(payload.medicineName) : null;
    default:
      return null;
  }
}

interface TrendsMetricDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricId: TrendMetricId;
  summaryValue: string;
  babyId: Id<"babyProfiles">;
  fromISO: string;
  toISO: string;
  rangeDays: number;
  rangeAggregates: Record<string, { feeds?: any; diapers?: any; sleeps?: any; meds?: any }> | null;
}

export function TrendsMetricDrawer({
  open,
  onOpenChange,
  metricId,
  summaryValue,
  babyId,
  fromISO,
  toISO,
  rangeDays,
  rangeAggregates,
}: TrendsMetricDrawerProps) {
  const [tab, setTab] = useState<"calendar" | "graph" | "entries">("calendar");
  const config = METRIC_CONFIG[metricId];
  if (!config) return null;

  const dayEvents = useQuery(
    api.events.getEventsForRange,
    open && babyId ? { babyId, from: fromISO, to: toISO, types: ["FEED_BOTTLE", "FEED_BREAST", "PUMP", "DIAPER", "SLEEP", "MED_DOSE", "VACCINE_DOSE"], limit: 500 } : "skip"
  );

  const chartData = (() => {
    if (!rangeAggregates || Object.keys(rangeAggregates).length === 0) return [];
    const today = new Date();
    const rows = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const agg = rangeAggregates[key];
      rows.push({
        date: key,
        label: rangeDays <= 7 ? d.toLocaleDateString("en-IN", { weekday: "short" }) : `${d.getDate()}/${d.getMonth() + 1}`,
        feedCount: agg?.feeds?.count ?? 0,
        feedMl: agg?.feeds?.totalMl ?? 0,
        diaperCount: agg?.diapers?.count ?? 0,
        sleepHours: Math.round(((agg?.sleeps?.totalMin ?? 0) / 60) * 10) / 10,
      });
    }
    return rows;
  })();

  const filteredEvents = (dayEvents ?? []).filter((e) => {
    const types = config.eventTypes.flatMap((t) => {
      if (t === "feed") return ["FEED_BOTTLE", "FEED_BREAST", "PUMP"];
      if (t === "diaper") return ["DIAPER"];
      if (t === "sleep") return ["SLEEP"];
      if (t === "health") return ["MED_DOSE", "VACCINE_DOSE"];
      return [];
    });
    return types.includes(e.type);
  });

  const tabs = [
    { key: "calendar" as const, label: "Calendar" },
    { key: "graph" as const, label: "Graph" },
    { key: "entries" as const, label: "Entries" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-serif font-bold text-espresso">
            {config.title}
          </DialogTitle>
          <p className="text-sm text-muted mt-1">{summaryValue}</p>
        </DialogHeader>

        <div className="flex gap-2 border-b border-muted/10 mb-4 shrink-0">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === key
                  ? "bg-sage/20 text-sage"
                  : "text-muted hover:text-espresso"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          {tab === "calendar" && (
            <TrendsCalendar
              babyId={babyId}
              eventTypes={config.eventTypes}
            />
          )}
          {tab === "graph" && chartData.length > 0 && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {config.chartField === "feedMl" ? (
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7C9A82" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#7C9A82" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6B6B6B" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#6B6B6B" }} width={35} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const row = payload[0].payload as Record<string, unknown>;
                        const val = row?.[config.chartField];
                        return (
                          <div className="bg-white rounded-xl border border-muted/10 shadow-lg p-3 text-[11px]">
                            <p className="font-bold text-espresso">{String(row?.date ?? "")}</p>
                            <p className="text-espresso font-mono">
                              {String(val ?? "—")} {config.chartLabel}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={config.chartField}
                      stroke="#7C9A82"
                      strokeWidth={2}
                      fill="url(#metricGrad)"
                      dot={{ r: 3, fill: "#7C9A82", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6B6B6B" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#6B6B6B" }} width={25} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const row = payload[0].payload as Record<string, unknown>;
                        return (
                          <div className="bg-white rounded-xl border border-muted/10 shadow-lg p-3 text-[11px]">
                            <p className="font-bold text-espresso">{String(row?.date ?? "")}</p>
                            <p className="text-espresso font-mono">
                              {String(row?.[config.chartField] ?? "—")} {config.chartLabel}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey={config.chartField}
                      fill="#7C9A82"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
          {tab === "graph" && chartData.length === 0 && (
            <p className="text-sm text-muted py-8 text-center">No data for this period</p>
          )}
          {tab === "entries" && (
            <ul className="space-y-2">
              {filteredEvents.length === 0 ? (
                <p className="text-sm text-muted py-8 text-center">No entries in this period</p>
              ) : (
                filteredEvents
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((e) => (
                    <li
                      key={e._id}
                      className="flex items-center gap-3 py-2 px-3 rounded-xl bg-oat/30"
                    >
                      <span className="text-[11px] font-mono text-muted shrink-0">
                        {formatTime(e.timestamp)}
                      </span>
                      <span className="material-symbols-outlined text-base text-muted">
                        {EVENT_TYPE_ICONS[e.type] ?? "circle"}
                      </span>
                      <span className="text-sm text-espresso truncate">
                        {getEventDetail(e.type, (e.payload as Record<string, unknown>) ?? {}) ?? "—"}
                      </span>
                    </li>
                  ))
              )}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TrendsMetricDrawer;
