"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatTimeSince, formatDateFull, formatBabyAge } from "@/lib/time";
import { EVENT_TYPES } from "@/lib/constants";

export default function TodayPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    babyId
      ? {
          babyId,
          date: todayStr,
        }
      : "skip"
  );

  const upcomingReminders = useQuery(
    api.events.computeUpcomingReminders,
    babyId
      ? {
          babyId,
        }
      : "skip"
  );

  const getLastFeedDisplay = () => {
    if (!lastEvents) return { time: "--", detail: "No feed logged" };
    
    const bottle = lastEvents[EVENT_TYPES.FEED_BOTTLE];
    const breast = lastEvents[EVENT_TYPES.FEED_BREAST];
    
    if (bottle) {
      const payload = bottle.payload as any;
      const contentLabel =
        payload?.formulaName ||
        (payload?.contentType === "breast_milk"
          ? "Breast Milk (Pumped)"
          : payload?.contentType === "cow_milk"
          ? "Cow Milk"
          : "Formula");
      return {
        time: formatTimeSince(bottle.timestamp),
        detail: payload?.amountMl ? `${payload.amountMl}ml - ${contentLabel}` : "Bottle feed",
      };
    }
    
    if (breast) {
      const payload = breast.payload as any;
      return {
        time: formatTimeSince(breast.timestamp),
        detail: payload?.durationMin ? `${payload.durationMin}min - ${payload.side || "Breast"}` : "Breast feed",
      };
    }
    
    return { time: "--", detail: "No feed logged" };
  };

  const getLastDiaperDisplay = () => {
    if (!lastEvents || !lastEvents[EVENT_TYPES.DIAPER]) {
      return { time: "--", detail: "No diaper logged" };
    }
    
    const diaper = lastEvents[EVENT_TYPES.DIAPER];
    const payload = diaper?.payload as any;
    const kind = payload?.kind || "wet";
    
    return {
      time: formatTimeSince(diaper.timestamp),
      detail: kind.charAt(0).toUpperCase() + kind.slice(1),
    };
  };

  const getLastSleepDisplay = () => {
    if (!lastEvents || !lastEvents[EVENT_TYPES.SLEEP]) {
      return { time: "Awake", detail: "No sleep logged" };
    }
    
    const sleep = lastEvents[EVENT_TYPES.SLEEP];
    const payload = sleep?.payload as any;
    
    if (payload?.endTs) {
      return {
        time: formatTimeSince(sleep.timestamp),
        detail: "Woke " + formatTimeSince(payload.endTs),
      };
    }
    
    return {
      time: "Sleeping",
      detail: "Started " + formatTimeSince(sleep.timestamp),
    };
  };

  const getLastMedDisplay = () => {
    if (!lastEvents || !lastEvents[EVENT_TYPES.MED_DOSE]) {
      return { time: "No meds", detail: "No medicine logged" };
    }
    
    const med = lastEvents[EVENT_TYPES.MED_DOSE];
    const payload = med?.payload as any;
    
    return {
      time: formatTimeSince(med.timestamp),
      detail: payload?.medicineName || "Medicine",
    };
  };

  const getNextReminderDisplay = () => {
    if (!upcomingReminders || upcomingReminders.length === 0) {
      return null;
    }
    
    const next = upcomingReminders[0];
    const dueTime = new Date(next.dueTime);
    const isOverdue = next.isOverdue;
    
    return {
      title: next.rule.title,
      time: isOverdue ? "Overdue" : dueTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
      isOverdue,
    };
  };

  const feedDisplay = getLastFeedDisplay();
  const diaperDisplay = getLastDiaperDisplay();
  const sleepDisplay = getLastSleepDisplay();
  const medDisplay = getLastMedDisplay();
  const nextReminder = getNextReminderDisplay();

  if (!mounted) {
    return null;
  }

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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-8">
            <div className="bg-white p-4 rounded-[20px] shadow-sm border border-muted/10 flex flex-col justify-between h-32 lg:h-40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-4xl text-sage">water_drop</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sage"></span>
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Last Feed</span>
              </div>
              <div>
                <div className="text-2xl lg:text-3xl font-mono font-bold text-espresso">{feedDisplay.time}</div>
                <div className="text-xs text-muted font-medium mt-1">{feedDisplay.detail}</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-[20px] shadow-sm border border-muted/10 flex flex-col justify-between h-32 lg:h-40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-4xl text-clay">baby_changing_station</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-clay"></span>
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Diaper</span>
              </div>
              <div>
                <div className="text-2xl lg:text-3xl font-mono font-bold text-espresso">{diaperDisplay.time}</div>
                <div className="text-xs text-muted font-medium mt-1">{diaperDisplay.detail}</div>
              </div>
            </div>

            <div className="bg-night/5 p-4 rounded-[20px] shadow-sm border border-night/5 flex flex-col justify-between h-32 lg:h-40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-4xl text-night">bedtime</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-night"></span>
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Sleep</span>
              </div>
              <div>
                <div className="text-lg lg:text-xl font-bold text-espresso">{sleepDisplay.time}</div>
                <div className="text-xs text-muted font-medium mt-1">{sleepDisplay.detail}</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-[20px] shadow-sm border border-muted/10 flex flex-col justify-between h-32 lg:h-40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-4xl text-alert-red">medication</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-alert-red"></span>
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Meds</span>
              </div>
              <div>
                <div className="text-lg font-bold text-espresso">{medDisplay.detail}</div>
                <div className="text-xs text-muted font-medium mt-1">{medDisplay.time}</div>
              </div>
            </div>
          </div>

          {dailyAggregates && (
            <div className="bg-white rounded-[20px] p-5 shadow-sm border border-muted/10 mb-8">
              <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Today's Summary</h3>
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

          {nextReminder && (
            <div className={`rounded-[20px] p-5 border mb-8 ${
              nextReminder.isOverdue 
                ? "bg-alert-red/5 border-alert-red/20" 
                : "bg-sage/5 border-sage/20"
            }`}>
              <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Next Reminder</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-espresso">{nextReminder.title}</div>
                  <div className={`text-sm ${nextReminder.isOverdue ? "text-alert-red" : "text-muted"}`}>
                    {nextReminder.time}
                  </div>
                </div>
                <span className={`material-symbols-outlined ${nextReminder.isOverdue ? "text-alert-red" : "text-sage"}`}>
                  notifications
                </span>
              </div>
            </div>
          )}

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
