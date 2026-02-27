"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatTime, formatDuration, isToday } from "@/lib/time";
import type { Id } from "../../convex/_generated/dataModel";

const TIME_LABELS = ["12 AM", "3", "6 AM", "9", "12 PM", "3", "6 PM", "9", "12 AM"];

function getSundayOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - copy.getDay());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekDatesSundayFirst(anchor: Date): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() + i);
    dates.push(toLocalDateStr(d));
  }
  return dates;
}

const EVENT_COLORS: Record<string, string> = {
  FEED_BOTTLE: "#7C9A82",
  FEED_BREAST: "#7C9A82",
  PUMP: "#6B8CAE",
  DIAPER: "#C4A484",
  SLEEP: "#7986CB",
  MED_DOSE: "#E57373",
  VACCINE_DOSE: "#9C7CF4",
};

function getEventDuration(
  type: string,
  payload: Record<string, unknown> | undefined
): number {
  if (!payload) return 15;
  switch (type) {
    case "SLEEP":
      if (payload.startTs && payload.endTs) {
        const start = new Date(payload.startTs as string).getTime();
        const end = new Date(payload.endTs as string).getTime();
        return Math.max(5, Math.floor((end - start) / 60000));
      }
      return 30;
    case "FEED_BOTTLE":
    case "FEED_BREAST":
      return (payload.durationMin as number) ?? 15;
    case "DIAPER":
    case "MED_DOSE":
    case "VACCINE_DOSE":
      return 5;
    default:
      return 15;
  }
}

function getEventStartTs(type: string, timestamp: string, payload: Record<string, unknown> | undefined): string {
  if (type === "SLEEP" && payload?.startTs) {
    return payload.startTs as string;
  }
  return timestamp;
}

interface TimelineEvent {
  id: string;
  type: string;
  dateStr: string;
  startMinutes: number;
  durationMinutes: number;
  color: string;
}

interface TrendsCalendarProps {
  babyId: Id<"babyProfiles">;
  aggFilters?: { formulaName?: string; feedContentType?: string; medicineName?: string };
  eventTypes?: string[];
}

export default function TrendsCalendar({
  babyId,
  aggFilters = {},
  eventTypes,
}: TrendsCalendarProps) {
  const [weekAnchor, setWeekAnchor] = useState(() => getSundayOfWeek(new Date()));
  const weekDates = useMemo(() => getWeekDatesSundayFirst(weekAnchor), [weekAnchor]);
  const fromISO = useMemo(() => `${weekDates[0]}T00:00:00.000Z`, [weekDates]);
  const toISO = useMemo(() => `${weekDates[6]}T23:59:59.999Z`, [weekDates]);

  const typesForQuery = useMemo(() => {
    if (!eventTypes || eventTypes.length === 0) return undefined;
    const map: Record<string, string[]> = {
      feed: ["FEED_BOTTLE", "FEED_BREAST", "PUMP"],
      diaper: ["DIAPER"],
      sleep: ["SLEEP"],
      health: ["MED_DOSE", "VACCINE_DOSE"],
    };
    const flat = eventTypes.flatMap((t) => map[t] ?? []);
    return flat.length > 0 ? flat : undefined;
  }, [eventTypes]);

  const events = useQuery(
    api.events.getEventsForRange,
    babyId ? { babyId, from: fromISO, to: toISO, types: typesForQuery, limit: 3000 } : "skip"
  );

  const timelineByDay = useMemo(() => {
    const byDay: Record<string, TimelineEvent[]> = {};
    for (const dateStr of weekDates) {
      byDay[dateStr] = [];
    }
    for (const e of events ?? []) {
      const dateStr = e.timestamp.split("T")[0];
      if (!byDay[dateStr]) continue;
      const startTs = getEventStartTs(e.type, e.timestamp, e.payload as Record<string, unknown> | undefined);
      const startDate = new Date(startTs);
      const startMinutes =
        startDate.getHours() * 60 + startDate.getMinutes() + startDate.getSeconds() / 60;
      const durationMinutes = getEventDuration(e.type, e.payload as Record<string, unknown> | undefined);
      const color = EVENT_COLORS[e.type] ?? "#9CA3AF";
      byDay[dateStr].push({
        id: e._id,
        type: e.type,
        dateStr,
        startMinutes,
        durationMinutes,
        color,
      });
    }
    for (const dateStr of weekDates) {
      byDay[dateStr].sort((a, b) => a.startMinutes - b.startMinutes);
    }
    return byDay;
  }, [events, weekDates]);

  const weekLabel = useMemo(() => {
    const end = new Date(weekAnchor);
    end.setDate(weekAnchor.getDate() + 6);
    return `${weekAnchor.toLocaleDateString("en-IN", { month: "short" })}`;
  }, [weekAnchor]);

  const goPrevWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() - 7);
    setWeekAnchor(d);
  };

  const goNextWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + 7);
    setWeekAnchor(d);
  };

  const goToThisWeek = () => {
    setWeekAnchor(getSundayOfWeek(new Date()));
  };

  const dowLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrevWeek}
            className="p-2 rounded-xl hover:bg-oat text-muted hover:text-espresso transition-colors"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          <span className="text-sm font-bold text-espresso">{weekLabel}</span>
          <button
            type="button"
            onClick={goNextWeek}
            className="p-2 rounded-xl hover:bg-oat text-muted hover:text-espresso transition-colors"
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        </div>
        <button
          type="button"
          onClick={goToThisWeek}
          className="text-xs font-bold text-sage hover:underline"
        >
          This week
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Day headers */}
          <div className="grid grid-cols-[3rem_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-px mb-1">
            <div />
            {weekDates.map((dateStr, i) => {
              const d = new Date(dateStr + "T12:00:00");
              const dayNum = d.getDate();
              return (
                <div
                  key={dateStr}
                  className="text-center text-[10px] font-bold text-muted py-1"
                >
                  <div>{dowLabels[i]}</div>
                  <div
                    className={
                      isToday(dateStr) ? "text-sage" : "text-espresso"
                    }
                  >
                    {dayNum}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline grid */}
          <div className="grid grid-cols-[3rem_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-px border border-muted/20 rounded-xl overflow-hidden bg-muted/5">
            {/* Time labels */}
            <div className="flex flex-col">
              {TIME_LABELS.map((label, i) => (
                <div
                  key={label + i}
                  className="flex items-center justify-end pr-2 py-1 text-[10px] text-muted border-b border-dotted border-muted/20 min-h-[2rem]"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDates.map((dateStr) => (
              <DayColumn
                key={dateStr}
                events={timelineByDay[dateStr] ?? []}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DayColumn({ events }: { events: TimelineEvent[] }) {
  const totalMinutes = 24 * 60;
  const rowHeight = 32;

  return (
    <div
      className="relative min-h-[256px] border-l border-muted/10 last:border-r-0"
      style={{ minHeight: 8 * rowHeight }}
    >
      {events.map((ev) => {
        const topPct = (ev.startMinutes / totalMinutes) * 100;
        const heightPct = Math.min(
          (ev.durationMinutes / totalMinutes) * 100,
          100 - topPct
        );
        const minHeight = Math.max(2, (ev.durationMinutes / 60) * rowHeight);
        return (
          <div
            key={ev.id}
            className="absolute left-1 right-1 rounded-sm opacity-90 hover:opacity-100 transition-opacity"
            style={{
              top: `${topPct}%`,
              height: `${heightPct}%`,
              minHeight: `${minHeight}px`,
              backgroundColor: ev.color,
            }}
            title={`${ev.type} · ${formatDuration(ev.durationMinutes)}`}
          />
        );
      })}
    </div>
  );
}
