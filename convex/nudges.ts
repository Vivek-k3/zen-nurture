import { query } from "./_generated/server";
import { v } from "convex/values";

type Nudge = {
  type: string;
  severity: "info" | "warn" | "alert";
  title: string;
  body: string;
  icon: string;
  hoursSince: number;
  avgHours: number;
};

export const getActiveNudges = query({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const nudges: Nudge[] = [];

    const typesToCheck = [
      { type: "FEED_BOTTLE", also: "FEED_BREAST", label: "fed", icon: "water_drop", warnMultiplier: 1.5, alertMultiplier: 2.0 },
      { type: "DIAPER", label: "changed diaper", icon: "baby_changing_station", warnMultiplier: 1.5, alertMultiplier: 2.0 },
      { type: "SLEEP", label: "slept", icon: "bedtime", warnMultiplier: 1.8, alertMultiplier: 2.5 },
    ];

    for (const check of typesToCheck) {
      const recentEvents = await ctx.db
        .query("events")
        .withIndex("by_babyId_type", (q) => q.eq("babyId", args.babyId))
        .filter((q) => {
          if (check.also) {
            return q.or(
              q.eq(q.field("type"), check.type),
              q.eq(q.field("type"), check.also)
            );
          }
          return q.eq(q.field("type"), check.type);
        })
        .order("desc")
        .take(30);

      if (recentEvents.length < 3) continue;

      const timestamps = recentEvents.map((e) => new Date(e.timestamp).getTime()).sort((a, b) => b - a);
      const lastTs = timestamps[0];
      const hoursSinceLast = (now - lastTs) / (1000 * 60 * 60);

      const intervals: number[] = [];
      for (let i = 0; i < Math.min(timestamps.length - 1, 15); i++) {
        intervals.push((timestamps[i] - timestamps[i + 1]) / (1000 * 60 * 60));
      }
      const avgHours = intervals.reduce((s, v) => s + v, 0) / intervals.length;

      if (avgHours < 0.5) continue;

      const roundedHours = Math.round(hoursSinceLast * 10) / 10;
      const roundedAvg = Math.round(avgHours * 10) / 10;

      if (hoursSinceLast > avgHours * check.alertMultiplier) {
        nudges.push({
          type: check.type,
          severity: "alert",
          title: `No ${check.label} in ${roundedHours}h`,
          body: `Usually every ${roundedAvg}h. This is ${Math.round(hoursSinceLast / avgHours * 10) / 10}x the average.`,
          icon: check.icon,
          hoursSince: roundedHours,
          avgHours: roundedAvg,
        });
      } else if (hoursSinceLast > avgHours * check.warnMultiplier) {
        nudges.push({
          type: check.type,
          severity: "warn",
          title: `${check.label.charAt(0).toUpperCase() + check.label.slice(1)} overdue`,
          body: `Last ${check.label} was ${roundedHours}h ago (avg: every ${roundedAvg}h).`,
          icon: check.icon,
          hoursSince: roundedHours,
          avgHours: roundedAvg,
        });
      }
    }

    const medEvents = await ctx.db
      .query("events")
      .withIndex("by_babyId_type", (q) => q.eq("babyId", args.babyId))
      .filter((q) => q.eq(q.field("type"), "MED_DOSE"))
      .order("desc")
      .take(5);

    const recentSkipped = medEvents.filter(
      (e) => (e.payload as any)?.outcome === "skipped"
    );
    if (recentSkipped.length >= 2) {
      nudges.push({
        type: "MED_DOSE",
        severity: "warn",
        title: "Meds skipped recently",
        body: `${recentSkipped.length} of the last ${medEvents.length} doses were skipped.`,
        icon: "medication",
        hoursSince: 0,
        avgHours: 0,
      });
    }

    return nudges;
  },
});
