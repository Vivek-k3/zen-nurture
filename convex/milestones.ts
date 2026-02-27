import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import { requireAuth, requireBabyAccess } from "./lib/auth";

export const list = query({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];
    await requireBabyAccess(ctx, args.babyId, user._id);
    return await ctx.db
      .query("milestones")
      .withIndex("by_babyId", (q) => q.eq("babyId", args.babyId))
      .collect();
  },
});

export const achieve = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    key: v.string(),
    title: v.string(),
    category: v.string(),
    achievedAt: v.optional(v.string()),
    note: v.optional(v.string()),
    photoIds: v.optional(v.array(v.string())),
    videoIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    await requireBabyAccess(ctx, args.babyId, user._id);
    const existing = await ctx.db
      .query("milestones")
      .withIndex("by_babyId_key", (q) =>
        q.eq("babyId", args.babyId).eq("key", args.key)
      )
      .first();

    const achievedAt = args.achievedAt ?? new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        achievedAt,
        note: args.note,
        photoIds: args.photoIds,
        videoIds: args.videoIds,
      });
      return existing._id;
    }

    return await ctx.db.insert("milestones", {
      babyId: args.babyId,
      key: args.key,
      title: args.title,
      category: args.category,
      achievedAt,
      note: args.note,
      photoIds: args.photoIds,
      videoIds: args.videoIds,
      createdAt: new Date().toISOString(),
    });
  },
});

export const createCustom = mutation({
  args: {
    babyId: v.id("babyProfiles"),
    title: v.string(),
    category: v.string(),
    achievedAt: v.optional(v.string()),
    note: v.optional(v.string()),
    photoIds: v.optional(v.array(v.string())),
    videoIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    await requireBabyAccess(ctx, args.babyId, user._id);

    const key = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const achievedAt = args.achievedAt ?? new Date().toISOString();

    return await ctx.db.insert("milestones", {
      babyId: args.babyId,
      key,
      title: args.title.trim(),
      category: args.category,
      achievedAt,
      note: args.note,
      photoIds: args.photoIds,
      videoIds: args.videoIds,
      isCustom: true,
      createdAt: new Date().toISOString(),
    });
  },
});

export const updateMilestone = mutation({
  args: {
    id: v.id("milestones"),
    note: v.optional(v.string()),
    photoIds: v.optional(v.array(v.string())),
    videoIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const milestone = await ctx.db.get(args.id);
    if (!milestone) throw new Error("Milestone not found");
    await requireBabyAccess(ctx, milestone.babyId, user._id);

    const updates: Record<string, unknown> = {};
    if (args.note !== undefined) updates.note = args.note;
    if (args.photoIds !== undefined) updates.photoIds = args.photoIds;
    if (args.videoIds !== undefined) updates.videoIds = args.videoIds;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.id, updates);
    }
    return args.id;
  },
});

export const unachieve = mutation({
  args: { id: v.id("milestones") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const milestone = await ctx.db.get(args.id);
    if (!milestone) throw new Error("Milestone not found");
    await requireBabyAccess(ctx, milestone.babyId, user._id);
    await ctx.db.patch(args.id, {
      achievedAt: undefined,
      note: undefined,
      photoIds: undefined,
      videoIds: undefined,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("milestones") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const milestone = await ctx.db.get(args.id);
    if (!milestone) throw new Error("Milestone not found");
    await requireBabyAccess(ctx, milestone.babyId, user._id);
    await ctx.db.delete(args.id);
  },
});
