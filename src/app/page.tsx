"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDateFull, formatBabyAge } from "@/lib/time";
import { EVENT_TYPES } from "@/lib/constants";
import { useLiveTimer, formatElapsed, formatElapsedCompact } from "@/hooks/useLiveTimer";

export default function TodayPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const babyProfile = useQuery(api.events.getBabyProfile, {});
  const todayStr = new Date().toISOString().split("T")[0];
  const babyId = babyProfile?._id;

  const lastEvents = useQuery(
    api.events.getLastEventsByTypes,
    babyId
      ? {
          babyId,
          eventTypes: [
            EVENT_TYPES.FEED_BOTTLE,
            EVENT_TYPES.FEED_BREAST,
            EVENT_TYPES.DIAPER,
            EVENT_TYPES.SLEEP,
            EVENT_TYPES.MED_DOSE,
          ],
        }
      : "skip"
  );

  const dailyAggregates = useQuery(
    api.events.getDailyAggregates,
    babyId ? { babyId, date: todayStr } : "skip"
  );

  const upcomingReminders = useQuery(
    api.events.computeUpcomingReminders,
    babyId ? { babyId } : "skip"
  );

  const now = useLiveTimer();

  if (!mounted) return null;

  const bottle = lastEvents?.[EVENT_TYPES.FEED_BOTTLE];
  const breast = lastEvents?.[EVENT_TYPES.FEED_BREAST];
  const lastFeed = pickLatest(bottle, breast);
  const lastDiaper = lastEvents?.[EVENT_TYPES.DIAPER];
  const lastSleep = lastEvents?.[EVENT_TYPES.SLEEP];
  const lastMed = lastEvents?.[EVENT_TYPES.MED_DOSE];

  const sleepPayload = lastSleep?.payload as any;
  const isSleeping = lastSleep && sleepPayload && !sleepPayload.endTs;

  const nextReminder = upcomingReminders?.[0] ?? null;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {!babyProfile ? (
        <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
          <span className="material-symbols-outlined text-5xl text-sage mb-4">child_friendly</span>
          <h3 className="text-xl font-bold text-espresso mb-2">Welcome to Zen Nurture</h3>
          <p className="text-muted mb-6">Complete setup to start tracking</p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-sage text-white px-6 py-3 rounded-full font-bold hover:bg-sage/90 transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
            Get Started
          </Link>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-bold text-espresso">
                {babyProfile.name ? `Good Morning, ${babyProfile.name}` : "Today"}
              </h1>
              <p className="text-muted text-sm mt-1">
                {formatDateFull(new Date())}
              </p>
            </div>
            {babyProfile.dob && (
              <div className="shrink-0 bg-sage/10 border border-sage/20 rounded-2xl px-4 py-2 text-center">
                <span className="material-symbols-outlined text-sage text-[18px] leading-none">cake</span>
                <p className="text-sm font-bold text-espresso mt-0.5">{formatBabyAge(babyProfile.dob)}</p>
              </div>
            )}
          </div>

          {/* Live Timer Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-8">
            <LiveCard
              label="Last Feed"
              icon="water_drop"
              color="sage"
              timestamp={lastFeed?.timestamp}
              detail={getFeedDetail(lastFeed)}
              now={now}
            />
            <LiveCard
              label="Diaper"
              icon="baby_changing_station"
              color="clay"
              timestamp={lastDiaper?.timestamp}
              detail={getDiaperDetail(lastDiaper)}
              now={now}
            />
            <LiveCard
              label="Sleep"
              icon="bedtime"
              color="night"
              timestamp={isSleeping ? lastSleep?.timestamp : (sleepPayload?.endTs ?? lastSleep?.timestamp)}
              detail={isSleeping ? "Sleeping now" : (sleepPayload?.endTs ? "Awake" : undefined)}
              now={now}
              active={!!isSleeping}
              darkBg
            />
            <LiveCard
              label="Meds"
              icon="medication"
              color="alert-red"
              timestamp={lastMed?.timestamp}
              detail={(lastMed?.payload as any)?.medicineName}
              now={now}
            />
          </div>

          {/* Daily Summary */}
          {dailyAggregates && (
            <div className="bg-white rounded-[20px] p-5 shadow-sm border border-muted/10 mb-8">
              <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Today&apos;s Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-sage">{dailyAggregates.feeds.count}</div>
                  <div className="text-xs text-muted">Feeds</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-sage">{dailyAggregates.feeds.totalMl}ml</div>
                  <div className="text-xs text-muted">Total intake</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-clay">{dailyAggregates.diapers.total}</div>
                  <div className="text-xs text-muted">Diapers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-night">{Math.round(dailyAggregates.sleeps.totalMinutes / 60 * 10) / 10}h</div>
                  <div className="text-xs text-muted">Sleep</div>
                </div>
              </div>
            </div>
          )}

          {/* Next Reminder */}
          {nextReminder && (
            <div className={`rounded-[20px] p-5 border mb-8 ${
              nextReminder.isOverdue
                ? "bg-alert-red/5 border-alert-red/20"
                : "bg-sage/5 border-sage/20"
            }`}>
              <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Next Reminder</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-espresso">{nextReminder.rule.title}</div>
                  <div className={`text-sm ${nextReminder.isOverdue ? "text-alert-red" : "text-muted"}`}>
                    {nextReminder.isOverdue
                      ? "Overdue"
                      : new Date(nextReminder.dueTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                  </div>
                </div>
                <span className={`material-symbols-outlined ${nextReminder.isOverdue ? "text-alert-red" : "text-sage"}`}>
                  notifications
                </span>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3 px-1">Quick Actions</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[
                { icon: "water_drop", label: "Feed", color: "sage" },
                { icon: "baby_changing_station", label: "Diaper", color: "clay" },
                { icon: "bedtime", label: "Sleep", color: "night" },
                { icon: "medication", label: "Medicine", color: "alert-red" },
              ].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('openQuickLogger'))}
                  className={`flex-shrink-0 flex items-center gap-2 bg-white px-4 py-3 rounded-full shadow-sm border border-muted/10 hover:border-${action.color}/30 transition-colors`}
                >
                  <span className={`material-symbols-outlined text-${action.color}`}>{action.icon}</span>
                  <span className="font-medium text-espresso text-sm">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---- Live Timer Card ---- */

function LiveCard({
  label,
  icon,
  color,
  timestamp,
  detail,
  now,
  active,
  darkBg,
}: {
  label: string;
  icon: string;
  color: string;
  timestamp?: string;
  detail?: string;
  now: number;
  active?: boolean;
  darkBg?: boolean;
}) {
  const ts = timestamp ? new Date(timestamp).getTime() : 0;
  const elapsed = ts ? formatElapsed(ts, now) : "--";
  const compact = ts ? formatElapsedCompact(ts, now) : null;

  return (
    <div className={`p-4 rounded-[20px] shadow-sm border flex flex-col justify-between h-32 lg:h-40 relative overflow-hidden group ${
      darkBg ? "bg-night/5 border-night/5" : "bg-white border-muted/10"
    }`}>
      <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
        <span className={`material-symbols-outlined text-4xl text-${color}`}>{icon}</span>
      </div>
      <div className="flex items-center gap-2">
        {active && <span className={`w-2 h-2 rounded-full bg-${color} animate-pulse`} />}
        {!active && <span className={`w-2 h-2 rounded-full bg-${color}`} />}
        <span className="text-[10px] uppercase font-bold text-muted tracking-wider">{label}</span>
      </div>
      <div>
        {ts ? (
          <>
            <div className={`font-mono font-bold text-espresso tabular-nums ${compact && compact.startsWith("00:") ? "text-2xl lg:text-3xl" : "text-xl lg:text-2xl"}`}>
              {elapsed}
            </div>
            <div className="text-xs text-muted font-medium mt-1 truncate">
              {detail || "Logged"}
            </div>
          </>
        ) : (
          <>
            <div className="text-xl font-bold text-muted/40">--</div>
            <div className="text-xs text-muted font-medium mt-1">Not logged</div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---- Helpers ---- */

function pickLatest(a?: any, b?: any) {
  if (!a && !b) return undefined;
  if (!a) return b;
  if (!b) return a;
  return new Date(a.timestamp) > new Date(b.timestamp) ? a : b;
}

function getFeedDetail(event?: any): string | undefined {
  if (!event) return undefined;
  const p = event.payload as any;
  if (event.type === "FEED_BOTTLE") {
    const label = p?.formulaName || (p?.contentType === "breast_milk" ? "Breast Milk" : p?.contentType === "cow_milk" ? "Cow Milk" : "Formula");
    return p?.amountMl ? `${p.amountMl}ml · ${label}` : "Bottle";
  }
  if (event.type === "FEED_BREAST") {
    return p?.durationMin ? `${p.durationMin}min · ${p?.side || "Breast"}` : "Breast";
  }
  return "Feed";
}

function getDiaperDetail(event?: any): string | undefined {
  if (!event) return undefined;
  const kind = (event.payload as any)?.kind || "wet";
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}
