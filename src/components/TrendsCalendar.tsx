"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatTime, formatDuration, isToday } from "@/lib/time";
import { EVENT_TYPE_ICONS } from "@/lib/constants";

function getMondayOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekDates(monday: Date): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(toLocalDateStr(d));
  }
  return dates;
}

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
      if (payload.blowout) parts.push("blowout");
      if (payload.rash) parts.push("rash");
      return parts.length ? parts.join(" · ") : null;
    }
    case "SLEEP": {
      if (!payload.startTs || !payload.endTs) return "In progress";
      const start = new Date(payload.startTs as string).getTime();
      const end = new Date(payload.endTs as string).getTime();
      const min = Math.floor((end - start) / 60000);
      return formatDuration(min);
    }
    default:
      return null;
  }
}

interface TrendsCalendarProps {
  babyId: string;
  aggFilters?: { formulaName?: string; feedContentType?: string; medicineName?: string };
}

export default function TrendsCalendar({ babyId, aggFilters = {} }: TrendsCalendarProps) {
  const [weekAnchor, setWeekAnchor] = useState(() => getMondayOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    toLocalDateStr(new Date())
  );

  const weekDates = useMemo(() => getWeekDates(weekAnchor), [weekAnchor]);
  const fromISO = useMemo(() => `${weekDates[0]}T00:00:00.000Z`, [weekDates]);
  const toISO = useMemo(() => `${weekDates[6]}T23:59:59.999Z`, [weekDates]);

  const rangeAggregates = useQuery(
    api.events.getRangeAggregates,
    babyId ? { babyId, from: fromISO, to: toISO, ...aggFilters } : "skip"
  );

  const dayEvents = useQuery(
    api.events.getEventsByDate,
    babyId && selectedDate ? { babyId, date: selectedDate } : "skip"
  );

  const feeds = (dayEvents ?? []).filter(
    (e) => e.type === "FEED_BOTTLE" || e.type === "FEED_BREAST"
  );
  const diapers = (dayEvents ?? []).filter((e) => e.type === "DIAPER");
  const sleeps = (dayEvents ?? []).filter((e) => e.type === "SLEEP");

  const weekLabel = useMemo(() => {
    const end = new Date(weekAnchor);
    end.setDate(weekAnchor.getDate() + 6);
    return `${weekAnchor.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
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
    setWeekAnchor(getMondayOfWeek(new Date()));
    setSelectedDate(toLocalDateStr(new Date()));
  };

  return (
    <div className="space-y-4">
      {/* Week nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrevWeek}
            className="p-2 rounded-xl hover:bg-oat text-muted hover:text-espresso transition-colors"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={goNextWeek}
            className="p-2 rounded-xl hover:bg-oat text-muted hover:text-espresso transition-colors"
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        </div>
        <h3 className="text-sm font-bold text-espresso">{weekLabel}</h3>
        <button
          type="button"
          onClick={goToThisWeek}
          className="text-xs font-bold text-sage hover:underline"
        >
          This week
        </button>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dow) => (
          <div
            key={dow}
            className="text-center text-[10px] font-bold text-muted uppercase tracking-wider py-1"
          >
            {dow}
          </div>
        ))}
        {weekDates.map((dateStr) => {
          const agg = rangeAggregates?.[dateStr];
          const feedCount = agg?.feeds?.count ?? 0;
          const diaperCount = agg?.diapers?.count ?? 0;
          const sleepSessions = agg?.sleeps?.sessions ?? 0;
          const isSelected = selectedDate === dateStr;
          const d = new Date(dateStr + "T12:00:00");
          const dayNum = d.getDate();

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDate(dateStr)}
              className={`rounded-xl p-3 text-left min-h-[88px] border-2 transition-all ${
                isSelected
                  ? "border-sage bg-sage/5 shadow-sm"
                  : "border-transparent bg-white hover:bg-oat/50 border-muted/10"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-sm font-bold ${
                    isToday(dateStr) ? "text-sage" : "text-espresso"
                  }`}
                >
                  {dayNum}
                </span>
                {isToday(dateStr) && (
                  <span className="text-[9px] font-bold text-sage bg-sage/20 px-1.5 py-0.5 rounded">
                    Today
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {feedCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] bg-sage/15 text-sage rounded px-1.5 py-0.5 font-mono">
                    <span className="material-symbols-outlined text-[12px]">water_drop</span>
                    {feedCount}
                  </span>
                )}
                {diaperCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] bg-clay/15 text-clay rounded px-1.5 py-0.5 font-mono">
                    <span className="material-symbols-outlined text-[12px]">baby_changing_station</span>
                    {diaperCount}
                  </span>
                )}
                {sleepSessions > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] bg-night/15 text-night rounded px-1.5 py-0.5 font-mono">
                    <span className="material-symbols-outlined text-[12px]">bedtime</span>
                    {sleepSessions}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-muted/10">
          <h3 className="text-sm font-bold text-espresso mb-4">
            {isToday(selectedDate)
              ? "Today"
              : new Date(selectedDate + "T12:00:00").toLocaleDateString("en-IN", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
          </h3>

          <div className="space-y-4">
            {/* Feed sessions */}
            <Section title="Feed sessions" icon="water_drop" color="sage" count={feeds.length}>
              {feeds.length === 0 ? (
                <p className="text-xs text-muted">No feeds logged</p>
              ) : (
                <ul className="space-y-2">
                  {feeds.map((e) => (
                    <SessionRow
                      key={e._id}
                      time={e.timestamp}
                      icon={EVENT_TYPE_ICONS[e.type] ?? "restaurant"}
                      detail={getEventDetail(e.type, e.payload ?? {})}
                    />
                  ))}
                </ul>
              )}
            </Section>

            {/* Diaper sessions */}
            <Section title="Diaper sessions" icon="baby_changing_station" color="clay" count={diapers.length}>
              {diapers.length === 0 ? (
                <p className="text-xs text-muted">No diapers logged</p>
              ) : (
                <ul className="space-y-2">
                  {diapers.map((e) => (
                    <SessionRow
                      key={e._id}
                      time={e.timestamp}
                      icon="baby_changing_station"
                      detail={getEventDetail(e.type, e.payload ?? {})}
                    />
                  ))}
                </ul>
              )}
            </Section>

            {/* Sleep sessions */}
            <Section title="Sleep sessions" icon="bedtime" color="night" count={sleeps.length}>
              {sleeps.length === 0 ? (
                <p className="text-xs text-muted">No sleep logged</p>
              ) : (
                <ul className="space-y-2">
                  {sleeps.map((e) => (
                    <SessionRow
                      key={e._id}
                      time={e.timestamp}
                      icon="bedtime"
                      detail={getEventDetail(e.type, e.payload ?? {})}
                    />
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

const COLOR_CLASSES: Record<string, string> = {
  sage: "text-sage",
  clay: "text-clay",
  night: "text-night",
};

function Section({
  title,
  icon,
  color,
  count,
  children,
}: {
  title: string;
  icon: string;
  color: "sage" | "clay" | "night";
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`material-symbols-outlined text-lg ${COLOR_CLASSES[color] ?? "text-muted"}`}>{icon}</span>
        <h4 className="text-xs font-bold text-muted uppercase tracking-wider">{title}</h4>
        <span className="text-[10px] font-mono text-muted">({count})</span>
      </div>
      {children}
    </div>
  );
}

function SessionRow({
  time,
  icon,
  detail,
}: {
  time: string;
  icon: string;
  detail: string | null;
}) {
  return (
    <li className="flex items-center gap-3 py-2 px-3 rounded-xl bg-oat/30">
      <span className="text-[11px] font-mono text-muted shrink-0">{formatTime(time)}</span>
      <span className="material-symbols-outlined text-base text-muted">{icon}</span>
      <span className="text-sm text-espresso truncate">{detail ?? "—"}</span>
    </li>
  );
}
