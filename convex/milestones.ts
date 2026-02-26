import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { babyId: v.id("babyProfiles") },
  handler: async (ctx, args) => {
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
    await ctx.db.patch(args.id, { achievedAt: undefined, note: undefined });
  },
});

export const remove = mutation({
  args: { id: v.id("milestones") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
