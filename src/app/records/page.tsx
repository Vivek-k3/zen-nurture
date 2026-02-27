"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, EVENT_TYPE_COLORS } from "@/lib/constants";
import { formatTime, formatDate, isToday, isYesterday } from "@/lib/time";
import EventPhotos from "@/components/EventPhotos";

type TypeFilter = "all" | string;

export default function RecordsPage() {
  const [mounted, setMounted] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  useEffect(() => { setMounted(true); }, []);

  const babyProfile = useQuery(api.events.getBabyProfile, {});
  const babyId = babyProfile?._id;

  const events = useQuery(
    api.events.listTimeline,
    babyId
      ? { babyId, limit: 100, ...(typeFilter !== "all" ? { type: typeFilter } : {}) }
      : "skip"
  );

  if (!mounted) return null;

  const grouped = groupByDate(events ?? []);

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-espresso">Timeline</h1>
        <p className="text-muted text-sm mt-1">All events logged for {babyProfile?.name ?? "baby"}</p>
      </div>

      {/* Type filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        <FilterChip label="All" active={typeFilter === "all"} onClick={() => setTypeFilter("all")} />
        {["FEED_BOTTLE", "FEED_BREAST", "DIAPER", "SLEEP", "MED_DOSE", "NOTE", "GROWTH"].map((type) => (
          <FilterChip
            key={type}
            label={EVENT_TYPE_LABELS[type] ?? type}
            active={typeFilter === type}
            onClick={() => setTypeFilter(type)}
          />
        ))}
      </div>

      {!babyProfile ? (
        <EmptyState icon="child_friendly" title="No baby profile" subtitle="Add your baby in Settings first" />
      ) : !events || events.length === 0 ? (
        <EmptyState icon="timeline" title="No events yet" subtitle="Log your first event using the + button" />
      ) : (
        <div className="space-y-6">
          {grouped.map(({ label, events: dayEvents }) => (
            <div key={label}>
              <div className="sticky top-0 z-10 bg-oat/90 backdrop-blur-sm py-2 px-1">
                <h2 className="text-xs font-bold text-muted uppercase tracking-wider">{label}</h2>
              </div>
              <div className="space-y-2">
                {dayEvents.map((event: any) => (
                  <TimelineCard key={event._id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Timeline Card ---- */

function TimelineCard({ event }: { event: any }) {
  const type = event.type as string;
  const icon = EVENT_TYPE_ICONS[type] ?? "event";
  const color = EVENT_TYPE_COLORS[type] ?? "muted";
  const label = EVENT_TYPE_LABELS[type] ?? type;
  const payload = event.payload ?? {};
  const detail = getEventDetail(type, payload);
  const loggedBy = event.loggedByName;
  const source = event.source;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-muted/10 flex gap-3">
      {/* Icon */}
      <div className={`h-10 w-10 shrink-0 rounded-xl bg-${color}/10 flex items-center justify-center`}>
        <span className={`material-symbols-outlined text-${color} text-xl`}>{icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-espresso text-sm">{label}</h3>
          <span className="text-[11px] text-muted font-mono shrink-0">
            {formatTime(event.timestamp)}
          </span>
        </div>

        {detail && (
          <p className="text-xs text-muted mt-0.5 truncate">{detail}</p>
        )}

        {/* Photos */}
        {event.photoIds?.length > 0 && (
          <div className="mt-2">
            <EventPhotos storageIds={event.photoIds} />
          </div>
        )}

        {/* Attribution line */}
        <div className="flex items-center gap-2 mt-1.5">
          {loggedBy && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted bg-oat/60 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[12px]">person</span>
              {loggedBy}
            </span>
          )}
          {source && source !== "manual" && (
            <span className="inline-flex items-center gap-1 text-[10px] text-sage bg-sage/8 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[12px]">smart_toy</span>
              {source}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Helpers ---- */

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
        active ? "bg-espresso text-oat" : "bg-white text-muted border border-muted/10 hover:border-muted/30"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
      <span className="material-symbols-outlined text-5xl text-muted/30 mb-4">{icon}</span>
      <h3 className="text-xl font-bold text-espresso mb-2">{title}</h3>
      <p className="text-muted">{subtitle}</p>
    </div>
  );
}

function getEventDetail(type: string, payload: any): string | null {
  switch (type) {
    case "FEED_BOTTLE": {
      const parts = [];
      if (payload.amountMl) parts.push(`${payload.amountMl}ml`);
      if (payload.formulaName) parts.push(payload.formulaName);
      else if (payload.contentType === "breast_milk") parts.push("Breast Milk");
      else if (payload.contentType === "cow_milk") parts.push("Cow Milk");
      return parts.join(" · ") || null;
    }
    case "FEED_BREAST": {
      const parts = [];
      if (payload.durationMin) parts.push(`${payload.durationMin}min`);
      if (payload.side) parts.push(payload.side);
      return parts.join(" · ") || null;
    }
    case "PUMP":
      return payload.amountMl ? `${payload.amountMl}ml` : null;
    case "DIAPER": {
      const parts = [];
      if (payload.kind) parts.push(payload.kind);
      if (payload.texture) parts.push(payload.texture);
      if (payload.color) parts.push(payload.color);
      if (payload.blowout) parts.push("blowout");
      if (payload.rash) parts.push("rash");
      return parts.join(" · ") || null;
    }
    case "SLEEP":
      return payload.endTs ? "Completed" : "In progress";
    case "MED_DOSE": {
      const parts = [];
      if (payload.medicineName) parts.push(payload.medicineName);
      if (payload.doseValue) parts.push(`${payload.doseValue} ${payload.doseUnit ?? ""}`);
      if (payload.outcome) parts.push(payload.outcome);
      return parts.join(" · ") || null;
    }
    case "NOTE":
      return payload.text ? payload.text.slice(0, 80) : null;
    case "GROWTH": {
      const parts = [];
      if (payload.weightKg) parts.push(`${payload.weightKg}kg`);
      if (payload.heightCm) parts.push(`${payload.heightCm}cm`);
      if (payload.headCm) parts.push(`head ${payload.headCm}cm`);
      return parts.join(" · ") || null;
    }
    default:
      return null;
  }
}

function groupByDate(events: any[]) {
  const groups: { label: string; events: any[] }[] = [];
  let currentLabel = "";

  for (const event of events) {
    const label = isToday(event.timestamp)
      ? "Today"
      : isYesterday(event.timestamp)
      ? "Yesterday"
      : formatDate(event.timestamp);

    if (label !== currentLabel) {
      groups.push({ label, events: [] });
      currentLabel = label;
    }
    groups[groups.length - 1].events.push(event);
  }

  return groups;
}
