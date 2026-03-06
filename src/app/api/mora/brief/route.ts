import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { EVENT_TYPES } from "@/lib/constants";
import { getToken } from "@/lib/auth";

type BriefStatusTone = "calm" | "gentle" | "alert";

type BriefAction = {
  id: string;
  label: string;
  description: string;
  prefill: {
    view: "feed" | "diaper" | "sleep" | "meds";
    feedSubType?: "bottle" | "breast";
    medName?: string;
    isSleepingNow?: boolean;
  };
};

function getConvex(token?: string) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  const client = new ConvexHttpClient(url);
  if (token) client.setAuth(token);
  return client;
}

function formatRelativeTime(date?: string | null) {
  if (!date) return "Not logged yet";
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function formatClock(date?: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function pickLatestEvent(events: Array<any>) {
  return events
    .filter(Boolean)
    .sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0] ?? null;
}

function getFeedDetails(event: any) {
  if (!event) return null;
  const payload = event.payload ?? {};
  if (event.type === EVENT_TYPES.FEED_BOTTLE) {
    const amount = payload.amountMl ? `${payload.amountMl}ml` : "Bottle";
    return payload.formulaName ? `${amount} · ${payload.formulaName}` : amount;
  }
  if (event.type === EVENT_TYPES.FEED_BREAST) {
    const duration = payload.durationMin ? `${payload.durationMin}min` : "Breastfeed";
    return payload.side ? `${duration} · ${payload.side}` : duration;
  }
  return "Feed logged";
}

function buildDefaultAction(): BriefAction {
  return {
    id: "log_feed",
    label: "Log a feed",
    description: "Capture the next bottle or breastfeed in one tap.",
    prefill: { view: "feed", feedSubType: "bottle" },
  };
}

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return Response.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { babyId, pageLabel } = await req.json();
  const convex = getConvex(token);
  const profile = await convex.query(
    api.events.getBabyProfile,
    babyId ? { id: babyId } : {}
  );

  if (!profile?._id) {
    return Response.json({
      pageLabel: pageLabel ?? "Today",
      babyId: null,
      headline: "Mora is ready",
      body: "Add a baby profile to turn live events into a calm daily brief.",
      statusTone: "calm",
      primaryAction: buildDefaultAction(),
      suggestions: ["What can you help with?", "Summarize the last 24h"],
      chips: [],
    });
  }

  const today = new Date().toISOString().split("T")[0];
  const [lastEvents, dailyAggregates, upcomingReminders, nudges] = await Promise.all([
    convex.query(api.events.getLastEventsByTypes, {
      babyId: profile._id,
      eventTypes: [
        EVENT_TYPES.FEED_BOTTLE,
        EVENT_TYPES.FEED_BREAST,
        EVENT_TYPES.DIAPER,
        EVENT_TYPES.SLEEP,
        EVENT_TYPES.MED_DOSE,
      ],
    }),
    convex.query(api.events.getDailyAggregates, { babyId: profile._id, date: today }),
    convex.query(api.events.computeUpcomingReminders, { babyId: profile._id }),
    convex.query(api.nudges.getActiveNudges, {
      babyId: profile._id,
      now: new Date().toISOString(),
    }),
  ]);

  const lastFeed = pickLatestEvent([
    lastEvents?.[EVENT_TYPES.FEED_BOTTLE],
    lastEvents?.[EVENT_TYPES.FEED_BREAST],
  ]);
  const lastDiaper = lastEvents?.[EVENT_TYPES.DIAPER] ?? null;
  const lastSleep = lastEvents?.[EVENT_TYPES.SLEEP] ?? null;
  const lastMed = lastEvents?.[EVENT_TYPES.MED_DOSE] ?? null;
  const nextReminder = upcomingReminders?.[0] ?? null;
  const topNudge = nudges?.[0] ?? null;
  const sleepPayload = (lastSleep?.payload ?? {}) as { endTs?: string };
  const isSleepingNow = Boolean(lastSleep && !sleepPayload.endTs);
  const feedCountToday = dailyAggregates?.feeds?.count ?? 0;
  const diaperCountToday = dailyAggregates?.diapers?.total ?? 0;
  const sleepHoursToday =
    Math.round(((dailyAggregates?.sleeps?.totalMinutes ?? 0) / 60) * 10) / 10;

  let statusTone: BriefStatusTone = "calm";
  let headline = `A gentle read on ${profile.name}'s day`;
  let body = lastFeed
    ? `Last feed ${formatRelativeTime(lastFeed.timestamp)}. ${getFeedDetails(lastFeed)}.`
    : `No feed is logged yet today. Mora can help you start the timeline cleanly.`;
  let primaryAction = buildDefaultAction();
  const suggestions = new Set<string>([
    "Summarize the last 24h",
    "Anything I should know right now?",
  ]);

  if (topNudge) {
    statusTone = topNudge.severity === "alert" ? "alert" : "gentle";
    headline = topNudge.title;
    body = topNudge.body;

    if (topNudge.type === EVENT_TYPES.DIAPER) {
      primaryAction = {
        id: "log_diaper",
        label: "Log a diaper",
        description: "Capture the change now and reset Mora's view of the day.",
        prefill: { view: "diaper" },
      };
      suggestions.add("Show recent diaper patterns");
    } else if (topNudge.type === EVENT_TYPES.SLEEP) {
      primaryAction = {
        id: "log_sleep",
        label: isSleepingNow ? "Review sleep session" : "Log sleep",
        description: isSleepingNow
          ? "Check whether the current sleep session should be ended."
          : "Capture the latest nap or night sleep.",
        prefill: { view: "sleep", isSleepingNow },
      };
      suggestions.add("How has sleep looked this week?");
    } else if (topNudge.type === EVENT_TYPES.MED_DOSE) {
      primaryAction = {
        id: "log_medicine",
        label: "Log medicine",
        description: "Record the latest dose so Mora can keep reminders accurate.",
        prefill: {
          view: "meds",
          medName: (lastMed?.payload as any)?.medicineName,
        },
      };
      suggestions.add("Review recent meds");
    } else {
      primaryAction = buildDefaultAction();
      body = `${topNudge.body} Last feed ${formatRelativeTime(lastFeed?.timestamp)}.`;
      suggestions.add("Should I create a feed reminder?");
    }
  } else if (nextReminder?.isOverdue) {
    statusTone = "gentle";
    headline = "A reminder is waiting";
    body = `${nextReminder.rule.title} was due ${formatClock(nextReminder.dueTime) ?? "earlier"}. Keeping it current helps Mora stay trustworthy.`;
    primaryAction = nextReminder.rule.category === "medicine"
      ? {
          id: "log_medicine",
          label: "Log medicine",
          description: "Record the dose and clear the loose end.",
          prefill: {
            view: "meds",
            medName: (lastMed?.payload as any)?.medicineName,
          },
        }
      : buildDefaultAction();
    suggestions.add("Review upcoming reminders");
  } else if (!lastFeed) {
    headline = `Let's start ${profile.name}'s day well`;
    body = "There isn't a feed on the timeline yet. One quick log gives Mora something real to work from.";
  } else if (feedCountToday >= 4) {
    headline = `${profile.name} is settling into a rhythm`;
    body = `You've already logged ${feedCountToday} feeds today and ${diaperCountToday} diapers. Mora can help spot patterns from here.`;
    primaryAction = {
      id: "log_diaper",
      label: "Log the next diaper",
      description: "Keep today's rhythm complete with one more quick entry.",
      prefill: { view: "diaper" },
    };
    suggestions.add("Any feeding patterns?");
  }

  const chips = [
    {
      label: "Last feed",
      value: lastFeed ? formatRelativeTime(lastFeed.timestamp) : "Not logged",
      accent: "sage",
    },
    {
      label: "Today",
      value: `${feedCountToday} feeds`,
      accent: "sage",
    },
    {
      label: "Sleep",
      value: isSleepingNow
        ? "Sleeping now"
        : `${sleepHoursToday}h`,
      accent: "night",
    },
    {
      label: "Next",
      value: nextReminder
        ? nextReminder.isOverdue
          ? "Reminder due"
          : nextReminder.rule.title
        : "Nothing due",
      accent: nextReminder?.isOverdue ? "alert-red" : "clay",
    },
  ];

  return Response.json({
    pageLabel: pageLabel ?? "Today",
    babyId: profile._id,
    headline,
    body,
    statusTone,
    primaryAction,
    suggestions: Array.from(suggestions).slice(0, 3),
    chips,
    meta: {
      lastFeedAt: lastFeed?.timestamp ?? null,
      lastDiaperAt: lastDiaper?.timestamp ?? null,
      lastSleepAt: lastSleep?.timestamp ?? null,
      lastMedAt: lastMed?.timestamp ?? null,
      overdue: Boolean(topNudge || nextReminder?.isOverdue),
    },
  });
}
