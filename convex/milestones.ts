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

    if (existing) {
      await ctx.db.patch(existing._id, {
        achievedAt: args.achievedAt ?? new Date().toISOString(),
        note: args.note,
      });
      return existing._id;
    }

    return await ctx.db.insert("milestones", {
      ...args,
      achievedAt: args.achievedAt ?? new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  },
});

export const unachieve = mutation({
  args: { id: v.id("milestones") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const milestone = await ctx.db.get(args.id);
    if (!milestone) throw new Error("Milestone not found");
    await requireBabyAccess(ctx, milestone.babyId, user._id);
    await ctx.db.patch(args.id, { achievedAt: undefined, note: undefined });
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
