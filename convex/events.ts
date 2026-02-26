import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getBabyProfiles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("babyProfiles").order("desc").collect();
  },
});

export const getBabyProfile = query({
  args: { id: v.optional(v.id("babyProfiles")) },
  handler: async (ctx, args) => {
    if (args.id) {
      return await ctx.db.get(args.id);
    }
    const profiles = await ctx.db.query("babyProfiles").order("desc").take(1);
    return profiles[0] || null;
  },
});

export const createBabyProfile = mutation({
  args: {
    name: v.string(),
    dob: v.string(),
    gender: v.optional(v.string()),
    timezone: v.optional(v.string()),
    measurementUnits: v.optional(v.object({
      volume: v.optional(v.string()),
      weight: v.optional(v.string()),
      length: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("babyProfiles", {
      ...args,
      timezone: args.timezone || "Asia/Kolkata",
      createdAt: new Date().toISOString(),
    });
    return id;
  },
});

export const updateBabyProfile = mutation({
  args: {
    id: v.id("babyProfiles"),
    name: v.optional(v.string()),
    dob: v.optional(v.string()),
    gender: v.optional(v.string()),
    timezone: v.optional(v.string()),
    measurementUnits: v.optional(v.object({
      volume: v.optional(v.string()),
      weight: v.optional(v.string()),
      length: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const listCaregivers = query({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("caregivers")
      .withIndex("by_babyId", (q) => q.eq("babyId", args.babyId))
      .collect();
  },
});

export const createCaregiver = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    displayName: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("caregivers", {
      ...args,
      createdAt: new Date().toISOString(),
    });
    return id;
  },
});

export const deleteCaregiver = mutation({
  args: { id: v.id("caregivers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const listEvents = query({
  args: {
    babyId: v.id("babyProfiles"),
    from: v.optional(v.string()),
    to: v.optional(v.string()),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("events")
      .withIndex("by_babyId_timestamp", (q) => q.eq("babyId", args.babyId));

    if (args.from) {
      q = q.filter((q) => q.gte("timestamp", args.from!));
    }
    if (args.to) {
      q = q.filter((q) => q.lte("timestamp", args.to!));
    }
    if (args.type) {
      q = q.filter((q) => q.eq("type", args.type!));
    }

    const results = await q.order("desc").take(args.limit || 100);
    return results;
  },
});

export const getEventsByDate = query({
  args: {
    babyId: v.id("babyProfiles"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const startOfDay = new Date(args.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(args.date);
    endOfDay.setHours(23, 59, 59, 999);

    return await ctx.db
      .query("events")
      .withIndex("by_babyId_timestamp", (q) => 
        q.eq("babyId", args.babyId as any)
      )
      .filter((q) =>
        q.and(
          q.gte("timestamp", startOfDay.toISOString()),
          q.lte("timestamp", endOfDay.toISOString())
        )
      )
      .order("desc")
      .collect();
  },
});

export const getLastEventByType = query({
  args: {
    babyId: v.id("babyProfiles"),
    eventType: v.string(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_babyId_type", (q) => 
        q.eq("babyId", args.babyId as any)
      )
      .filter((q) =>
        q.eq("type", args.eventType)
      )
      .order("desc")
      .take(1);
    return events[0] || null;
  },
});

export const getLastEventsByTypes = query({
  args: {
    babyId: v.id("babyProfiles"),
    eventTypes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const results: Record<string, any | null> = {};
    
    for (const eventType of args.eventTypes) {
      const events = await ctx.db
        .query("events")
        .withIndex("by_babyId_type", (q) => 
          q.eq("babyId", args.babyId as any)
        )
        .filter((q) => q.eq("type", eventType))
        .order("desc")
        .take(1);
      results[eventType] = events[0] || null;
    }
    
    return results;
  },
});

export const getDailyAggregates = query({
  args: {
    babyId: v.id("babyProfiles"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const startOfDay = new Date(args.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(args.date);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await ctx.db
      .query("events")
      .withIndex("by_babyId_timestamp", (q) => 
        q.eq("babyId", args.babyId as any)
      )
      .filter((q) =>
        q.and(
          q.gte("timestamp", startOfDay.toISOString()),
          q.lte("timestamp", endOfDay.toISOString())
        )
      )
      .collect();

    const feeds = events.filter(e => e.type.startsWith("FEED"));
    const diapers = events.filter(e => e.type === "DIAPER");
    const sleeps = events.filter(e => e.type === "SLEEP");
    const meds = events.filter(e => e.type === "MED_DOSE");

    let totalFeedMl = 0;
    let totalBreastMin = 0;
    let feedCount = 0;
    let diaperWet = 0;
    let diaperDirty = 0;
    let diaperDry = 0;
    let diaperMixed = 0;
    const diaperByTexture: Record<string, number> = {};
    const diaperByColor: Record<string, number> = {};
    let diaperBlowoutCount = 0;
    let diaperRashCount = 0;
    let sleepTotalMin = 0;
    let medsTaken = 0;
    let medsSkipped = 0;

    feeds.forEach(e => {
      const payload = e.payload as any;
      if (e.type === "FEED_BOTTLE" && payload?.amountMl) {
        totalFeedMl += payload.amountMl;
        feedCount++;
      } else if (e.type === "FEED_BREAST" && payload?.durationMin) {
        totalBreastMin += payload.durationMin;
        feedCount++;
      } else if (e.type === "PUMP" && payload?.amountMl) {
        totalFeedMl += payload.amountMl;
      }
    });

    diapers.forEach(e => {
      const payload = e.payload as any;
      if (payload?.kind === "wet") diaperWet++;
      else if (payload?.kind === "dirty") diaperDirty++;
      else if (payload?.kind === "dry") diaperDry++;
      else if (payload?.kind === "mixed") diaperMixed++;

      if (payload?.texture) {
        diaperByTexture[payload.texture] = (diaperByTexture[payload.texture] || 0) + 1;
      }
      if (payload?.color) {
        diaperByColor[payload.color] = (diaperByColor[payload.color] || 0) + 1;
      }
      if (payload?.blowout) diaperBlowoutCount++;
      if (payload?.rash) diaperRashCount++;
    });

    sleeps.forEach(e => {
      const payload = e.payload as any;
      if (payload?.startTs && payload?.endTs) {
        const start = new Date(payload.startTs).getTime();
        const end = new Date(payload.endTs).getTime();
        sleepTotalMin += Math.floor((end - start) / 60000);
      }
    });

    meds.forEach(e => {
      const payload = e.payload as any;
      if (payload?.outcome === "taken") medsTaken++;
      else if (payload?.outcome === "skipped") medsSkipped++;
    });

    return {
      date: args.date,
      feeds: {
        totalMl: totalFeedMl,
        totalBreastMin,
        count: feedCount,
      },
      diapers: {
        wet: diaperWet,
        dirty: diaperDirty,
        dry: diaperDry,
        mixed: diaperMixed,
        byTexture: diaperByTexture,
        byColor: diaperByColor,
        blowoutCount: diaperBlowoutCount,
        rashCount: diaperRashCount,
        total: diapers.length,
      },
      sleeps: {
        totalMinutes: sleepTotalMin,
        sessions: sleeps.length,
      },
      meds: {
        taken: medsTaken,
        skipped: medsSkipped,
        adherence: medsTaken + medsSkipped > 0 
          ? Math.round((medsTaken / (medsTaken + medsSkipped)) * 100) 
          : 100,
      },
    };
  },
});

export const getRangeAggregates = query({
  args: {
    babyId: v.id("babyProfiles"),
    from: v.string(),
    to: v.string(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_babyId_timestamp", (q) => 
        q.eq("babyId", args.babyId as any)
      )
      .filter((q) =>
        q.and(
          q.gte("timestamp", args.from),
          q.lte("timestamp", args.to)
        )
      )
      .collect();

    const dailyData: Record<string, any> = {};
    
    events.forEach(e => {
      const date = e.timestamp.split("T")[0];
      if (!dailyData[date]) {
        dailyData[date] = {
          feeds: { count: 0, totalMl: 0 },
          diapers: {
            count: 0,
            wet: 0,
            dirty: 0,
            dry: 0,
            mixed: 0,
            byTexture: {},
            byColor: {},
            blowoutCount: 0,
            rashCount: 0,
          },
          sleeps: { totalMin: 0 },
          meds: { taken: 0, skipped: 0 },
        };
      }

      const payload = e.payload as any;
      
      if (e.type === "FEED_BOTTLE" && payload?.amountMl) {
        dailyData[date].feeds.count++;
        dailyData[date].feeds.totalMl += payload.amountMl;
      } else if (e.type === "FEED_BREAST") {
        dailyData[date].feeds.count++;
      } else if (e.type === "PUMP" && payload?.amountMl) {
        dailyData[date].feeds.totalMl += payload.amountMl;
      } else if (e.type === "DIAPER") {
        dailyData[date].diapers.count++;
        if (payload?.kind === "wet") dailyData[date].diapers.wet++;
        else if (payload?.kind === "dirty") dailyData[date].diapers.dirty++;
        else if (payload?.kind === "dry") dailyData[date].diapers.dry++;
        else if (payload?.kind === "mixed") dailyData[date].diapers.mixed++;
        if (payload?.texture) {
          dailyData[date].diapers.byTexture[payload.texture] =
            (dailyData[date].diapers.byTexture[payload.texture] || 0) + 1;
        }
        if (payload?.color) {
          dailyData[date].diapers.byColor[payload.color] =
            (dailyData[date].diapers.byColor[payload.color] || 0) + 1;
        }
        if (payload?.blowout) dailyData[date].diapers.blowoutCount++;
        if (payload?.rash) dailyData[date].diapers.rashCount++;
      } else if (e.type === "SLEEP" && payload?.startTs && payload?.endTs) {
        const start = new Date(payload.startTs).getTime();
        const end = new Date(payload.endTs).getTime();
        dailyData[date].sleeps.totalMin += Math.floor((end - start) / 60000);
      } else if (e.type === "MED_DOSE") {
        if (payload?.outcome === "taken") dailyData[date].meds.taken++;
        else if (payload?.outcome === "skipped") dailyData[date].meds.skipped++;
      }
    });

    return dailyData;
  },
});

export const createEvent = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    type: v.string(),
    timestamp: v.string(),
    caregiverId: v.optional(v.id("caregivers")),
    payload: v.optional(v.any()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("events", {
      ...args,
      source: args.source || "manual",
      createdAt: new Date().toISOString(),
    });
    return id;
  },
});

export const updateEvent = mutation({
  args: {
    id: v.id("events"),
    timestamp: v.optional(v.string()),
    caregiverId: v.optional(v.id("caregivers")),
    payload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return id;
  },
});

export const deleteEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const listFormulas = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("formulas").collect();
  },
});

export const upsertFormula = mutation({
  args: {
    name: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("formulas")
      .filter((q) => q.eq("name", args.name))
      .take(1);

    if (existing.length > 0) {
      return existing[0]._id;
    }

    const id = await ctx.db.insert("formulas", {
      ...args,
      createdAt: new Date().toISOString(),
    });
    return id;
  },
});

export const listMedicines = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("medicines").collect();
  },
});

export const upsertMedicine = mutation({
  args: {
    name: v.string(),
    defaultDoseUnit: v.optional(v.string()),
    concentrationText: v.optional(v.string()),
    instructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("medicines")
      .filter((q) => q.eq("name", args.name))
      .take(1);

    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, args);
      return existing[0]._id;
    }

    const id = await ctx.db.insert("medicines", {
      ...args,
      createdAt: new Date().toISOString(),
    });
    return id;
  },
});

export const listReminderRules = query({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reminderRules")
      .filter((q) => q.eq("babyId", args.babyId as any))
      .order("desc")
      .collect();
  },
});

export const getReminderRule = query({
  args: { id: v.id("reminderRules") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createReminderRule = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    category: v.string(),
    title: v.string(),
    triggerType: v.string(),
    triggerConfig: v.optional(v.any()),
    enabled: v.optional(v.boolean()),
    quietHoursStart: v.optional(v.number()),
    quietHoursEnd: v.optional(v.number()),
    snoozeOptions: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("reminderRules", {
      ...args,
      enabled: args.enabled ?? true,
      createdAt: new Date().toISOString(),
    });
    return id;
  },
});

export const updateReminderRule = mutation({
  args: {
    id: v.id("reminderRules"),
    title: v.optional(v.string()),
    triggerType: v.optional(v.string()),
    triggerConfig: v.optional(v.any()),
    enabled: v.optional(v.boolean()),
    quietHoursStart: v.optional(v.number()),
    quietHoursEnd: v.optional(v.number()),
    snoozeOptions: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const deleteReminderRule = mutation({
  args: { id: v.id("reminderRules") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const computeUpcomingReminders = query({
  args: {
    babyId: v.id("babyProfiles"),
    now: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentTime = args.now ? new Date(args.now) : new Date();
    const rules = await ctx.db
      .query("reminderRules")
      .filter((q) => q.eq("babyId", args.babyId as any))
      .collect();

    const enabledRules = rules.filter((r) => r.enabled);
    const lastEvents: Record<string, any> = {};

    for (const rule of enabledRules) {
      if (rule.category !== "custom" && rule.triggerType === "afterLastEventType") {
        const events = await ctx.db
          .query("events")
          .withIndex("by_babyId_type", (q) => 
            q.eq("babyId", args.babyId as any)
          )
          .filter((q) => q.eq("type", rule.triggerConfig?.lastEventType))
          .order("desc")
          .take(1);
        
        if (events.length > 0) {
          lastEvents[rule._id] = events[0];
        }
      }
    }

    const upcoming: Array<{
      rule: any;
      dueTime: string;
      isOverdue: boolean;
    }> = [];

    for (const rule of enabledRules) {
      if (rule.triggerType === "fixedTimes" && rule.triggerConfig?.times) {
        for (const time of rule.triggerConfig.times) {
          const [hours, minutes] = time.split(":").map(Number);
          const dueTime = new Date(currentTime);
          dueTime.setHours(hours, minutes, 0, 0);
          
          if (dueTime < currentTime) {
            dueTime.setDate(dueTime.getDate() + 1);
          }

          upcoming.push({
            rule,
            dueTime: dueTime.toISOString(),
            isOverdue: false,
          });
        }
      } else if (rule.triggerType === "afterLastEventType" && lastEvents[rule._id]) {
        const lastEvent = lastEvents[rule._id];
        const lastEventTime = new Date(lastEvent.timestamp);
        const intervalMs = (rule.triggerConfig?.intervalHours || 3) * 60 * 60 * 1000;
        const dueTime = new Date(lastEventTime.getTime() + intervalMs);

        upcoming.push({
          rule,
          dueTime: dueTime.toISOString(),
          isOverdue: dueTime < currentTime,
        });
      }
    }

    return upcoming.sort((a, b) => 
      new Date(a.dueTime).getTime() - new Date(b.dueTime).getTime()
    ).slice(0, 10);
  },
});

export const exportBabyData = query({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.babyId);
    const events = await ctx.db
      .query("events")
      .filter((q) => q.eq("babyId", args.babyId as any))
      .collect();
    const caregivers = await ctx.db
      .query("caregivers")
      .filter((q) => q.eq("babyId", args.babyId as any))
      .collect();
    const reminders = await ctx.db
      .query("reminderRules")
      .filter((q) => q.eq("babyId", args.babyId as any))
      .collect();
    const formulas = await ctx.db.query("formulas").collect();
    const medicines = await ctx.db.query("medicines").collect();

    return {
      exportedAt: new Date().toISOString(),
      profile,
      events,
      caregivers,
      reminders,
      formulas,
      medicines,
    };
  },
});

export const clearBabyData = mutation({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .filter((q) => q.eq("babyId", args.babyId as any))
      .collect();
    
    for (const event of events) {
      await ctx.db.delete(event._id);
    }

    const reminders = await ctx.db
      .query("reminderRules")
      .filter((q) => q.eq("babyId", args.babyId as any))
      .collect();
    
    for (const reminder of reminders) {
      await ctx.db.delete(reminder._id);
    }

    const caregivers = await ctx.db
      .query("caregivers")
      .filter((q) => q.eq("babyId", args.babyId as any))
      .collect();
    
    for (const caregiver of caregivers) {
      await ctx.db.delete(caregiver._id);
    }
  },
});
