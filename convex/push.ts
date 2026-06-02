import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import { requireAuth } from "./lib/auth";

export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: user._id,
        keys: args.keys,
      });
      return existing._id;
    }

    return await ctx.db.insert("pushSubscriptions", {
      userId: user._id,
      endpoint: args.endpoint,
      keys: args.keys,
      createdAt: new Date().toISOString(),
    });
  },
});

export const unsubscribe = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const sub = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (sub && sub.userId === user._id) await ctx.db.delete(sub._id);
  },
});

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const listSubscriptionsByUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const listAllForFamily = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const membership = await ctx.db
      .query("familyMembers")
      .withIndex("by_familyId_userId", (q) =>
        q.eq("familyId", args.familyId).eq("userId", user._id)
      )
      .first();
    if (!membership) throw new Error("Not a member of this family");
    const members = await ctx.db
      .query("familyMembers")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .collect();

    const subs = [];
    for (const member of members) {
      const userSubs = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_userId", (q) => q.eq("userId", member.userId))
        .collect();
      subs.push(...userSubs);
    }
    return subs;
  },
});

export const unsubscribeByEndpoint = internalMutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();
    if (sub) await ctx.db.delete(sub._id);
  },
});

export const listSubscriptionsForFamily = internalQuery({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("familyMembers")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .collect();

    const subs = [];
    for (const member of members) {
      const userSubs = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_userId", (q) => q.eq("userId", member.userId))
        .collect();
      subs.push(...userSubs);
    }
    return subs;
  },
});

/** Record push delivery outcomes (batched) for visibility into failures. */
export const recordDeliveries = internalMutation({
  args: {
    deliveries: v.array(
      v.object({
        endpoint: v.string(),
        userId: v.optional(v.string()),
        status: v.string(),
        attempts: v.number(),
        title: v.optional(v.string()),
        error: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { deliveries }) => {
    const now = new Date().toISOString();
    for (const d of deliveries) {
      await ctx.db.insert("pushDeliveries", { ...d, createdAt: now });
    }
  },
});
