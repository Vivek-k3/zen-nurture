import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getWeeklyComparison = query({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    thisMonday.setHours(0, 0, 0, 0);

    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);

    const thisSunday = new Date(thisMonday);
    thisSunday.setDate(thisMonday.getDate() + 6);
    thisSunday.setHours(23, 59, 59, 999);

    const lastSunday = new Date(thisMonday);
    lastSunday.setTime(thisMonday.getTime() - 1);

    const computeWeek = async (from: Date, to: Date) => {
      const events = await ctx.db
        .query("events")
        .withIndex("by_babyId_timestamp", (q) => q.eq("babyId", args.babyId))
        .filter((q) =>
          q.and(
            q.gte(q.field("timestamp"), from.toISOString()),
            q.lte(q.field("timestamp"), to.toISOString())
          )
        )
        .collect();

      let feedCount = 0, feedMl = 0, breastMin = 0;
      let diaperCount = 0, diaperWet = 0, diaperDirty = 0;
      let sleepMin = 0, sleepSessions = 0;
      let medsTaken = 0, medsSkipped = 0;
      let growthEntries = 0;
      let noteCount = 0;

      for (const e of events) {
        const p = (e.payload ?? {}) as any;
        switch (e.type) {
          case "FEED_BOTTLE":
            feedCount++;
            feedMl += p.amountMl ?? 0;
            break;
          case "FEED_BREAST":
            feedCount++;
            breastMin += p.durationMin ?? 0;
            break;
          case "PUMP":
            feedMl += p.amountMl ?? 0;
            break;
          case "DIAPER":
            diaperCount++;
            if (p.kind === "wet") diaperWet++;
            if (p.kind === "dirty") diaperDirty++;
            break;
          case "SLEEP":
            sleepSessions++;
            if (p.startTs && p.endTs) {
              sleepMin += Math.floor(
                (new Date(p.endTs).getTime() - new Date(p.startTs).getTime()) / 60000
              );
            }
            break;
          case "MED_DOSE":
            if (p.outcome === "taken") medsTaken++;
            else if (p.outcome === "skipped") medsSkipped++;
            break;
          case "GROWTH":
            growthEntries++;
            break;
          case "NOTE":
            noteCount++;
            break;
        }
      }

      const daysInRange = Math.max(1, Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        from: from.toISOString().split("T")[0],
        to: to.toISOString().split("T")[0],
        totalEvents: events.length,
        feeds: { count: feedCount, totalMl: feedMl, breastMin, perDay: Math.round((feedCount / daysInRange) * 10) / 10 },
        diapers: { count: diaperCount, wet: diaperWet, dirty: diaperDirty, perDay: Math.round((diaperCount / daysInRange) * 10) / 10 },
        sleep: { totalHours: Math.round((sleepMin / 60) * 10) / 10, sessions: sleepSessions, avgPerDay: Math.round((sleepMin / 60 / daysInRange) * 10) / 10 },
        meds: { taken: medsTaken, skipped: medsSkipped, adherence: medsTaken + medsSkipped > 0 ? Math.round((medsTaken / (medsTaken + medsSkipped)) * 100) : 100 },
        growth: growthEntries,
        notes: noteCount,
      };
    };

    const thisWeek = await computeWeek(thisMonday, now);
    const lastWeek = await computeWeek(lastMonday, lastSunday);

    return { thisWeek, lastWeek };
  },
});

export const saveDigest = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    weekStart: v.string(),
    weekEnd: v.string(),
    thisWeek: v.any(),
    lastWeek: v.any(),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("weeklyDigests")
      .withIndex("by_babyId_weekStart", (q) =>
        q.eq("babyId", args.babyId).eq("weekStart", args.weekStart)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { summary: args.summary, thisWeek: args.thisWeek, lastWeek: args.lastWeek });
      return existing._id;
    }

    return await ctx.db.insert("weeklyDigests", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const listDigests = query({
  args: { babyId: v.id("babyProfiles"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("weeklyDigests")
      .withIndex("by_babyId", (q) => q.eq("babyId", args.babyId))
      .order("desc")
      .take(args.limit ?? 10);
  },
});

export const getLatestDigest = query({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const digests = await ctx.db
      .query("weeklyDigests")
      .withIndex("by_babyId", (q) => q.eq("babyId", args.babyId))
      .order("desc")
      .take(1);
    return digests[0] ?? null;
  },
});
