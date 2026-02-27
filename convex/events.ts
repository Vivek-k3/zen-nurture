import { query, mutation, internalQuery } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { authComponent } from "./auth";
import {
  requireAuth,
  getUserFamilyIds,
  requireBabyAccess,
} from "./lib/auth";

const DEFAULT_CAREGIVER_COLORS = [
  "#7C9A82",
  "#C4A484",
  "#6B8CAE",
  "#E57373",
  "#9C7CF4",
  "#F4B942",
  "#4DB6AC",
  "#7986CB",
];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function getUtcDayRange(date: string) {
  if (!ISO_DATE_RE.test(date)) {
    throw new Error(`Invalid date format: ${date}`);
  }

  return {
    startOfDay: `${date}T00:00:00.000Z`,
    endOfDay: `${date}T23:59:59.999Z`,
  };
}

function pickNextCaregiverColor(caregivers: Array<{ color?: string | null }>) {
  const usedColors = new Set(
    caregivers.map((caregiver) => caregiver.color).filter((color): color is string => Boolean(color))
  );

  return (
    DEFAULT_CAREGIVER_COLORS.find((color) => !usedColors.has(color)) ??
    DEFAULT_CAREGIVER_COLORS[caregivers.length % DEFAULT_CAREGIVER_COLORS.length]
  );
}

async function ensureOwnerCaregiverRecord(
  ctx: MutationCtx,
  babyId: Id<"babyProfiles">
) {
  const babyProfile = await ctx.db.get(babyId);
  if (!babyProfile?.familyId) return null;

  const family = await ctx.db.get(babyProfile.familyId);
  if (!family?.ownerId) return null;

  const caregivers = await ctx.db
    .query("caregivers")
    .withIndex("by_babyId", (q) => q.eq("babyId", babyId))
    .collect();

  const existingOwnerCaregiver = caregivers.find(
    (caregiver) => caregiver.userId === family.ownerId
  );
  if (existingOwnerCaregiver) return existingOwnerCaregiver;

  const ownerUser = await authComponent.getAnyUserById(ctx, family.ownerId);
  const displayName =
    ownerUser?.name?.trim() ||
    ownerUser?.email?.split("@")[0] ||
    "Owner";

  const caregiverId = await ctx.db.insert("caregivers", {
    babyId,
    displayName,
    color: pickNextCaregiverColor(caregivers),
    userId: family.ownerId,
    createdAt: new Date().toISOString(),
  });

  return await ctx.db.get(caregiverId);
}

async function getLatestEventForType(
  ctx: QueryCtx,
  babyId: Id<"babyProfiles">,
  eventType: string
) {
  const events = await ctx.db
    .query("events")
    .withIndex("by_babyId_type_timestamp", (q) =>
      q.eq("babyId", babyId).eq("type", eventType)
    )
    .order("desc")
    .take(1);

  return events[0] || null;
}

export const getBabyProfiles = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];

    const familyIds = await getUserFamilyIds(ctx, user._id);
    if (familyIds.length === 0) return [];

    const allProfiles = [];
    for (const familyId of familyIds) {
      const profiles = await ctx.db
        .query("babyProfiles")
        .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
        .collect();
      allProfiles.push(...profiles);
    }
    return allProfiles.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
});

export const getBabyProfile = query({
  args: { id: v.optional(v.id("babyProfiles")) },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return null;

    if (args.id) {
      const profile = await ctx.db.get(args.id);
      if (!profile || !profile.familyId) return null;
      const familyIds = await getUserFamilyIds(ctx, user._id);
      if (!familyIds.includes(profile.familyId)) return null;
      return profile;
    }

    const familyIds = await getUserFamilyIds(ctx, user._id);
    if (familyIds.length === 0) return null;

    for (const familyId of familyIds) {
      const profiles = await ctx.db
        .query("babyProfiles")
        .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
        .order("desc")
        .take(1);
      if (profiles[0]) return profiles[0];
    }
    return null;
  },
});

export const internalGetBabyProfileById = internalQuery({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.babyId);
  },
});

export const createBabyProfile = mutation({
  args: {
    familyId: v.id("families"),
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
    const user = await requireAuth(ctx);
    const familyIds = await getUserFamilyIds(ctx, user._id);
    if (!familyIds.includes(args.familyId)) {
      throw new Error("Not a member of this family");
    }

    const id = await ctx.db.insert("babyProfiles", {
      ...args,
      timezone: args.timezone || "Asia/Kolkata",
      createdAt: new Date().toISOString(),
    });
    await ensureOwnerCaregiverRecord(ctx, id);
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
    const user = await requireAuth(ctx);
    await requireBabyAccess(ctx, args.id, user._id);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const listCaregivers = query({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];
    await requireBabyAccess(ctx, args.babyId, user._id);
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
    const user = await requireAuth(ctx);
    await requireBabyAccess(ctx, args.babyId, user._id);
    const id = await ctx.db.insert("caregivers", {
      ...args,
      createdAt: new Date().toISOString(),
    });
    return id;
  },
});

export const ensureOwnerCaregiver = mutation({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const babyProfile = await ctx.db.get(args.babyId);
    if (!babyProfile) throw new Error("Baby profile not found");
    if (!babyProfile.familyId) return null;

    const familyIds = await getUserFamilyIds(ctx, user._id);
    if (!familyIds.includes(babyProfile.familyId)) {
      throw new Error("Not a member of this family");
    }

    return await ensureOwnerCaregiverRecord(ctx, args.babyId);
  },
});

export const deleteCaregiver = mutation({
  args: { id: v.id("caregivers") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const caregiver = await ctx.db.get(args.id);
    if (!caregiver) return;

    const babyProfile = await ctx.db.get(caregiver.babyId);
    if (!babyProfile?.familyId) {
      await ctx.db.delete(args.id);
      return;
    }

    const familyIds = await getUserFamilyIds(ctx, user._id);
    if (!familyIds.includes(babyProfile.familyId)) {
      throw new Error("Not a member of this family");
    }

    const family = await ctx.db.get(babyProfile.familyId);
    if (family?.ownerId && caregiver.userId === family.ownerId) {
      throw new Error("Cannot remove the owner caregiver");
    }

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
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];
    await requireBabyAccess(ctx, args.babyId, user._id);
    let q = ctx.db
      .query("events")
      .withIndex("by_babyId_timestamp", (q) => q.eq("babyId", args.babyId));

    if (args.from) {
      q = q.filter((q) => q.gte(q.field("timestamp"), args.from!));
    }
    if (args.to) {
      q = q.filter((q) => q.lte(q.field("timestamp"), args.to!));
    }
    if (args.type) {
      q = q.filter((q) => q.eq(q.field("type"), args.type!));
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
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];
    await requireBabyAccess(ctx, args.babyId, user._id);
    const { startOfDay, endOfDay } = getUtcDayRange(args.date);

    return await ctx.db
      .query("events")
      .withIndex("by_babyId_timestamp", (q) =>
        q.eq("babyId", args.babyId).gte("timestamp", startOfDay).lte("timestamp", endOfDay)
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
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return null;
    await requireBabyAccess(ctx, args.babyId, user._id);
    return await getLatestEventForType(ctx, args.babyId, args.eventType);
  },
});

export const getLastEventsByTypes = query({
  args: {
    babyId: v.id("babyProfiles"),
    eventTypes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return {};
    await requireBabyAccess(ctx, args.babyId, user._id);
    const entries = await Promise.all(
      args.eventTypes.map(async (eventType) => [
        eventType,
        await getLatestEventForType(ctx, args.babyId, eventType),
      ] as const)
    );

    return Object.fromEntries(entries);
  },
});

export const getDailyAggregates = query({
  args: {
    babyId: v.id("babyProfiles"),
    date: v.string(),
    formulaName: v.optional(v.string()),
    feedContentType: v.optional(v.string()),
    medicineName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return null;
    await requireBabyAccess(ctx, args.babyId, user._id);
    const { startOfDay, endOfDay } = getUtcDayRange(args.date);

    const events = await ctx.db
      .query("events")
      .withIndex("by_babyId_timestamp", (q) =>
        q.eq("babyId", args.babyId).gte("timestamp", startOfDay).lte("timestamp", endOfDay)
      )
      .collect();

    const matchFeed = (e: { type: string; payload?: { formulaName?: string; contentType?: string } }) => {
      if (e.type === "FEED_BOTTLE") {
        if (args.formulaName) return ((e.payload as any)?.formulaName ?? "") === args.formulaName;
        if (args.feedContentType) return ((e.payload as any)?.contentType ?? "formula") === args.feedContentType;
        return true;
      }
      if (e.type === "FEED_BREAST") return !args.formulaName && !args.feedContentType;
      if (e.type === "PUMP") return !args.formulaName && !args.feedContentType;
      return false;
    };
    const matchMeds = (e: { type: string; payload?: { medicineName?: string } }) => {
      if (e.type !== "MED_DOSE") return false;
      if (args.medicineName) return ((e.payload as any)?.medicineName ?? "") === args.medicineName;
      return true;
    };

    const feeds = events.filter(e => e.type.startsWith("FEED") && matchFeed(e));
    const diapers = events.filter(e => e.type === "DIAPER");
    const sleeps = events.filter(e => e.type === "SLEEP");
    const meds = events.filter(e => e.type === "MED_DOSE" && matchMeds(e));

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

    const bottleSizeAvg =
      feedCount > 0 && totalFeedMl > 0 ? Math.round(totalFeedMl / feedCount) : 0;

    const feedEvents = events
      .filter((e) => (e.type === "FEED_BOTTLE" || e.type === "FEED_BREAST") && matchFeed(e))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let avgGapMin = 0;
    if (feedEvents.length >= 2) {
      let totalGap = 0;
      for (let i = 1; i < feedEvents.length; i++) {
        const prev = new Date(feedEvents[i - 1].timestamp).getTime();
        const curr = new Date(feedEvents[i].timestamp).getTime();
        totalGap += Math.floor((curr - prev) / 60000);
      }
      avgGapMin = Math.round(totalGap / (feedEvents.length - 1));
    }

    return {
      date: args.date,
      feeds: {
        totalMl: totalFeedMl,
        totalBreastMin,
        count: feedCount,
        bottleSizeAvg,
        avgGapMin,
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

const TRENDS_EVENT_TYPE_GROUPS: Record<string, string[]> = {
  feed: ["FEED_BOTTLE", "FEED_BREAST", "PUMP"],
  diaper: ["DIAPER"],
  sleep: ["SLEEP"],
  health: ["MED_DOSE", "VACCINE_DOSE"],
  notes: ["NOTE"],
  photos: [], // filter by photoIds, not type
};

export const getRangeAggregates = query({
  args: {
    babyId: v.id("babyProfiles"),
    from: v.string(),
    to: v.string(),
    formulaName: v.optional(v.string()),
    feedContentType: v.optional(v.string()),
    medicineName: v.optional(v.string()),
    eventTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return {};
    await requireBabyAccess(ctx, args.babyId, user._id);
    let events = await ctx.db
      .query("events")
      .withIndex("by_babyId_timestamp", (q) =>
        q.eq("babyId", args.babyId).gte("timestamp", args.from).lte("timestamp", args.to)
      )
      .collect();

    if (args.eventTypes && args.eventTypes.length > 0) {
      const flatTypes = new Set(
        args.eventTypes.flatMap((g) => TRENDS_EVENT_TYPE_GROUPS[g] ?? [g])
      );
      const hasPhotos = args.eventTypes.includes("photos");
      const hasNotes = args.eventTypes.includes("notes");
      const hasTypeFilter = flatTypes.size > 0;
      if (hasTypeFilter || hasPhotos || hasNotes) {
        events = events.filter((e) => {
          if (hasPhotos && (e.photoIds?.length ?? 0) > 0) return true;
          if (hasNotes && (e.type === "NOTE" || (e.payload as { notes?: string })?.notes)) return true;
          if (hasTypeFilter && flatTypes.has(e.type)) return true;
          return false;
        });
      }
    }

    const dailyData: Record<string, any> = {};
    const matchFeed = (e: { type: string; payload?: { formulaName?: string; contentType?: string } }) => {
      if (e.type === "FEED_BOTTLE") {
        if (args.formulaName) return (e.payload?.formulaName ?? "") === args.formulaName;
        if (args.feedContentType) return (e.payload?.contentType ?? "formula") === args.feedContentType;
        return true;
      }
      if (e.type === "FEED_BREAST") return !args.formulaName && !args.feedContentType;
      if (e.type === "PUMP") return !args.formulaName && !args.feedContentType;
      return false;
    };
    const matchMeds = (e: { type: string; payload?: { medicineName?: string } }) => {
      if (e.type !== "MED_DOSE") return false;
      if (args.medicineName) return (e.payload?.medicineName ?? "") === args.medicineName;
      return true;
    };
    
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
          sleeps: { totalMin: 0, sessions: 0 },
          meds: { taken: 0, skipped: 0 },
        };
      }

      const payload = e.payload as any;
      
      if (e.type === "FEED_BOTTLE" && payload?.amountMl && matchFeed(e)) {
        dailyData[date].feeds.count++;
        dailyData[date].feeds.totalMl += payload.amountMl;
      } else if (e.type === "FEED_BREAST" && matchFeed(e)) {
        dailyData[date].feeds.count++;
      } else if (e.type === "PUMP" && payload?.amountMl && matchFeed(e)) {
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
        dailyData[date].sleeps.sessions++;
      } else if (e.type === "MED_DOSE" && matchMeds(e)) {
        if (payload?.outcome === "taken") dailyData[date].meds.taken++;
        else if (payload?.outcome === "skipped") dailyData[date].meds.skipped++;
      }
    });

    for (const date of Object.keys(dailyData)) {
      const f = dailyData[date].feeds;
      f.bottleSizeAvg =
        f.count > 0 && f.totalMl > 0 ? Math.round(f.totalMl / f.count) : 0;
    }

    return dailyData;
  },
});

export const getTrendsRangeSummary = query({
  args: {
    babyId: v.id("babyProfiles"),
    from: v.string(),
    to: v.string(),
    formulaName: v.optional(v.string()),
    feedContentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return null;
    await requireBabyAccess(ctx, args.babyId, user._id);
    const events = await ctx.db
      .query("events")
      .withIndex("by_babyId_timestamp", (q) =>
        q.eq("babyId", args.babyId).gte("timestamp", args.from).lte("timestamp", args.to)
      )
      .collect();

    const matchFeed = (e: { type: string; payload?: { formulaName?: string; contentType?: string } }) => {
      if (e.type === "FEED_BOTTLE") {
        if (args.formulaName) return (e.payload?.formulaName ?? "") === args.formulaName;
        if (args.feedContentType) return (e.payload?.contentType ?? "formula") === args.feedContentType;
        return true;
      }
      if (e.type === "FEED_BREAST") return !args.formulaName && !args.feedContentType;
      return false;
    };

    const feedEvents = events
      .filter(
        (e) =>
          (e.type === "FEED_BOTTLE" || e.type === "FEED_BREAST") && matchFeed(e)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let totalMl = 0;
    let count = 0;
    let avgGapMin = 0;
    for (const e of feedEvents) {
      const p = e.payload as { amountMl?: number; durationMin?: number };
      if (e.type === "FEED_BOTTLE" && p?.amountMl) {
        totalMl += p.amountMl;
        count++;
      } else if (e.type === "FEED_BREAST") {
        count++;
      }
    }
    const bottleSizeAvg = count > 0 && totalMl > 0 ? Math.round(totalMl / count) : 0;
    if (feedEvents.length >= 2) {
      let totalGap = 0;
      for (let i = 1; i < feedEvents.length; i++) {
        const prev = new Date(feedEvents[i - 1].timestamp).getTime();
        const curr = new Date(feedEvents[i].timestamp).getTime();
        totalGap += Math.floor((curr - prev) / 60000);
      }
      avgGapMin = Math.round(totalGap / (feedEvents.length - 1));
    }
    return { bottleSizeAvg, avgGapMin };
  },
});

export const getEventsForRange = query({
  args: {
    babyId: v.id("babyProfiles"),
    from: v.string(),
    to: v.string(),
    types: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];
    await requireBabyAccess(ctx, args.babyId, user._id);
    let events = await ctx.db
      .query("events")
      .withIndex("by_babyId_timestamp", (q) =>
        q.eq("babyId", args.babyId).gte("timestamp", args.from).lte("timestamp", args.to)
      )
      .collect();

    if (args.types && args.types.length > 0) {
      const flat = new Set(
        args.types.flatMap((t) => TRENDS_EVENT_TYPE_GROUPS[t] ?? [t])
      );
      if (flat.size > 0) {
        events = events.filter((e) => flat.has(e.type));
      }
    }

    const limit = args.limit ?? 3000;
    return events.slice(0, limit);
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
    photoIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    await requireBabyAccess(ctx, args.babyId, user._id);
    const id = await ctx.db.insert("events", {
      ...args,
      source: args.source || "manual",
      createdAt: new Date().toISOString(),
      loggedBy: user._id,
      loggedByName: user.name,
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
    const user = await requireAuth(ctx);
    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");
    await requireBabyAccess(ctx, event.babyId, user._id);
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
    const user = await requireAuth(ctx);
    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");
    await requireBabyAccess(ctx, event.babyId, user._id);
    await ctx.db.delete(args.id);
  },
});

export const listFormulas = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];
    return await ctx.db.query("formulas").collect();
  },
});

export const getFormulasUsedByBaby = query({
  args: { babyId: v.id("babyProfiles"), from: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];
    await requireBabyAccess(ctx, args.babyId, user._id);
    const events = await ctx.db
      .query("events")
      .withIndex("by_babyId_type_timestamp", (q) =>
        q.eq("babyId", args.babyId).eq("type", "FEED_BOTTLE").gte("timestamp", args.from)
      )
      .collect();
    const names = new Set<string>();
    for (const e of events) {
      const name = (e.payload as { formulaName?: string })?.formulaName;
      if (name?.trim()) names.add(name.trim());
    }
    return Array.from(names).sort();
  },
});

export const getMedicinesUsedByBaby = query({
  args: { babyId: v.id("babyProfiles"), from: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];
    await requireBabyAccess(ctx, args.babyId, user._id);
    const events = await ctx.db
      .query("events")
      .withIndex("by_babyId_type_timestamp", (q) =>
        q.eq("babyId", args.babyId).eq("type", "MED_DOSE").gte("timestamp", args.from)
      )
      .collect();
    const names = new Set<string>();
    for (const e of events) {
      const name = (e.payload as { medicineName?: string })?.medicineName;
      if (name?.trim()) names.add(name.trim());
    }
    return Array.from(names).sort();
  },
});

export const upsertFormula = mutation({
  args: {
    name: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const existing = await ctx.db
      .query("formulas")
      .withIndex("by_name", (q) => q.eq("name", args.name))
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
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];
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
    await requireAuth(ctx);
    const existing = await ctx.db
      .query("medicines")
      .withIndex("by_name", (q) => q.eq("name", args.name))
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
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];
    await requireBabyAccess(ctx, args.babyId, user._id);
    return await ctx.db
      .query("reminderRules")
      .withIndex("by_babyId", (q) => q.eq("babyId", args.babyId))
      .order("desc")
      .collect();
  },
});

export const getReminderRule = query({
  args: { id: v.id("reminderRules") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return null;
    const rule = await ctx.db.get(args.id);
    if (!rule) return null;
    await requireBabyAccess(ctx, rule.babyId, user._id);
    return rule;
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
    const user = await requireAuth(ctx);
    await requireBabyAccess(ctx, args.babyId, user._id);
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
    const user = await requireAuth(ctx);
    const rule = await ctx.db.get(args.id);
    if (!rule) throw new Error("Reminder rule not found");
    await requireBabyAccess(ctx, rule.babyId, user._id);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const deleteReminderRule = mutation({
  args: { id: v.id("reminderRules") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const rule = await ctx.db.get(args.id);
    if (!rule) throw new Error("Reminder rule not found");
    await requireBabyAccess(ctx, rule.babyId, user._id);
    await ctx.db.delete(args.id);
  },
});

export const computeUpcomingReminders = query({
  args: {
    babyId: v.id("babyProfiles"),
    now: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];
    await requireBabyAccess(ctx, args.babyId, user._id);
    const currentTime = args.now ? new Date(args.now) : new Date();
    const rules = await ctx.db
      .query("reminderRules")
      .withIndex("by_babyId", (q) => q.eq("babyId", args.babyId))
      .collect();

    const enabledRules = rules.filter((r) => r.enabled);
    const lastEvents: Record<string, any> = {};

    for (const rule of enabledRules) {
      if (rule.category !== "custom" && rule.triggerType === "afterLastEventType") {
        const latestEvent = await getLatestEventForType(
          ctx,
          args.babyId,
          rule.triggerConfig?.lastEventType
        );

        if (latestEvent) {
          lastEvents[rule._id] = latestEvent;
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

export const internalComputeUpcomingReminders = internalQuery({
  args: {
    babyId: v.id("babyProfiles"),
    now: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentTime = args.now ? new Date(args.now) : new Date();
    const rules = await ctx.db
      .query("reminderRules")
      .withIndex("by_babyId", (q) => q.eq("babyId", args.babyId))
      .collect();

    const enabledRules = rules.filter((r) => r.enabled);
    const lastEvents: Record<string, { timestamp: string }> = {};

    for (const rule of enabledRules) {
      if (rule.category !== "custom" && rule.triggerType === "afterLastEventType") {
        const latestEvent = await getLatestEventForType(
          ctx,
          args.babyId,
          rule.triggerConfig?.lastEventType
        );

        if (latestEvent) {
          lastEvents[rule._id] = latestEvent;
        }
      }
    }

    const upcoming: Array<{
      rule: (typeof rules)[0];
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

export const listTimeline = query({
  args: {
    babyId: v.id("babyProfiles"),
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];
    await requireBabyAccess(ctx, args.babyId, user._id);
    let q = ctx.db
      .query("events")
      .withIndex("by_babyId_timestamp", (q) => q.eq("babyId", args.babyId));

    if (args.type) {
      q = q.filter((q) => q.eq(q.field("type"), args.type));
    }

    return await q.order("desc").take(args.limit ?? 50);
  },
});

export const listGrowthEvents = query({
  args: {
    babyId: v.id("babyProfiles"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];
    await requireBabyAccess(ctx, args.babyId, user._id);
    return await ctx.db
      .query("events")
      .withIndex("by_babyId_type", (q) =>
        q.eq("babyId", args.babyId)
      )
      .filter((q) => q.eq(q.field("type"), "GROWTH"))
      .order("asc")
      .take(args.limit ?? 200);
  },
});

export const exportBabyData = query({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    await requireBabyAccess(ctx, args.babyId, user._id);
    const profile = await ctx.db.get(args.babyId);
    const events = await ctx.db
      .query("events")
      .withIndex("by_babyId_timestamp", (q) => q.eq("babyId", args.babyId))
      .collect();
    const caregivers = await ctx.db
      .query("caregivers")
      .withIndex("by_babyId", (q) => q.eq("babyId", args.babyId))
      .collect();
    const reminders = await ctx.db
      .query("reminderRules")
      .withIndex("by_babyId", (q) => q.eq("babyId", args.babyId))
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
    const user = await requireAuth(ctx);
    await requireBabyAccess(ctx, args.babyId, user._id);
    const events = await ctx.db
      .query("events")
      .withIndex("by_babyId_timestamp", (q) => q.eq("babyId", args.babyId))
      .collect();
    
    for (const event of events) {
      await ctx.db.delete(event._id);
    }

    const reminders = await ctx.db
      .query("reminderRules")
      .withIndex("by_babyId", (q) => q.eq("babyId", args.babyId))
      .collect();
    
    for (const reminder of reminders) {
      await ctx.db.delete(reminder._id);
    }

    const caregivers = await ctx.db
      .query("caregivers")
      .withIndex("by_babyId", (q) => q.eq("babyId", args.babyId))
      .collect();
    
    for (const caregiver of caregivers) {
      await ctx.db.delete(caregiver._id);
    }
  },
});
