"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, EVENT_TYPE_COLORS, normalizeEventType } from "@/lib/constants";
import { authClient } from "@/lib/auth-client";
import { useLiveTimer, formatElapsed } from "@/hooks/useLiveTimer";
import { useGenderTheme } from "@/components/GenderTheme";

interface ActivityFeedProps {
  babyId: any;
  compact?: boolean;
}

export default function ActivityFeed({ babyId, compact = false }: ActivityFeedProps) {
  const events = useQuery(
    api.events.listTimeline,
    babyId ? { babyId, limit: compact ? 5 : 15 } : "skip"
  );
  const { data: session } = authClient.useSession();
  const now = useLiveTimer(60_000);
  const genderTheme = useGenderTheme();

  if (events === undefined) {
    if (compact) return null;
    return (
      <div className="bg-white rounded-[20px] p-5 shadow-sm border border-muted/10">
        <div className="flex items-center gap-2 mb-4">
          <span className={`material-symbols-outlined ${genderTheme.text} text-lg`}>groups</span>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider">Activity</h3>
          <span className={`ml-auto flex items-center gap-1 text-[10px] ${genderTheme.text} font-bold`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${genderTheme.primary} animate-pulse`} />
            Live
          </span>
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded-full bg-muted/10 w-3/4" />
                <div className="h-2.5 rounded-full bg-muted/10 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!events.length) {
    if (compact) return null;
    return (
      <div className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10 text-center">
        <span className="material-symbols-outlined text-3xl text-muted/30 mb-2">group</span>
        <p className="text-sm text-muted">No activity yet. Log an event to get started.</p>
      </div>
    );
  }

  const myUserId = session?.user?.id;

  return (
    <div className={compact ? "space-y-1" : "bg-white rounded-[20px] p-5 shadow-sm border border-muted/10"}>
      {!compact && (
        <div className="flex items-center gap-2 mb-4">
          <span className={`material-symbols-outlined ${genderTheme.text} text-lg`}>groups</span>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider">Activity</h3>
          <span className={`ml-auto flex items-center gap-1 text-[10px] ${genderTheme.text} font-bold`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${genderTheme.primary} animate-pulse`} />
            Live
          </span>
        </div>
      )}

      <div className={compact ? undefined : "max-h-[280px] overflow-y-auto -mx-1 px-1"}>
      {events.map((event: any) => {
        const normalizedType = normalizeEventType(event.type);
        const isMe = event.loggedBy === myUserId;
        const who = isMe ? "You" : (event.loggedByName || "Someone");
        const typeLabel = EVENT_TYPE_LABELS[normalizedType] ?? normalizedType;
        const icon = EVENT_TYPE_ICONS[normalizedType] ?? "event";
        const color = EVENT_TYPE_COLORS[normalizedType] ?? "muted";
        const ts = new Date(event.timestamp).getTime();
        const ago = formatElapsed(ts, now);
        const detail = getShortDetail(normalizedType, event.payload);

        if (compact) {
          return (
            <div key={event._id} className="flex items-center gap-2 py-1.5 px-1">
              <span className={`material-symbols-outlined text-[14px] text-${color}`}>{icon}</span>
              <p className="text-[11px] text-muted flex-1 truncate">
                <span className={`font-semibold ${isMe ? "text-espresso" : genderTheme.text}`}>{who}</span>
                {" "}logged {typeLabel}{detail ? ` · ${detail}` : ""}
                {event.source === "mora" ? " · via Mora" : ""}
              </p>
              <span className="text-[10px] text-muted/60 shrink-0">{ago}</span>
            </div>
          );
        }

        return (
          <div key={event._id} className="flex items-start gap-3 py-2.5 border-b border-muted/5 last:border-0">
            <div className={`h-8 w-8 shrink-0 rounded-lg bg-${color}/10 flex items-center justify-center`}>
              <span className={`material-symbols-outlined text-${color} text-[16px]`}>{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-espresso">
                <span className={`font-semibold ${isMe ? "" : genderTheme.text}`}>{who}</span>
                {" "}logged a <span className="font-medium">{typeLabel}</span>
                {detail ? <span className="text-muted"> · {detail}</span> : ""}
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                <span>{ago} ago</span>
                {event.source === "mora" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sage/8 px-1.5 py-0.5 text-sage">
                    <span className="material-symbols-outlined text-[12px]">smart_toy</span>
                    via Mora
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

function getShortDetail(type: string, payload: any): string | null {
  if (!payload) return null;
  switch (type) {
    case "FEED_BOTTLE": return payload.amountMl ? `${payload.amountMl}ml` : null;
    case "FEED_BREAST": return payload.side ?? null;
    case "DIAPER": return payload.kind ?? null;
    case "SLEEP": return payload.endTs ? "done" : "started";
    case "MED_DOSE": return payload.medicineName ?? null;
    case "NOTE": return payload.text?.slice(0, 30) ?? null;
    case "GROWTH": return payload.weightKg ? `${payload.weightKg}kg` : null;
    default: return null;
  }
}
