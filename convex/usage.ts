import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { UsageHandler } from "@convex-dev/agent";
import { internal } from "./_generated/api";
import { requireAuth } from "./lib/auth";
import { rateLimiter } from "./rateLimiter";

/** Records one generation's token usage as an "AI event" row. */
export const insertUsage = internalMutation({
  args: {
    userId: v.string(),
    agentName: v.optional(v.string()),
    model: v.string(),
    provider: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    totalTokens: v.number(),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const billingPeriod = now.slice(0, 7); // "YYYY-MM"
    await ctx.db.insert("aiUsage", {
      ...args,
      billingPeriod,
      createdAt: now,
    });

    // Maintain the per-user, per-period rollup incrementally so getMyUsage
    // reads one row instead of scanning every per-generation row.
    const existing = await ctx.db
      .query("aiUsageTotals")
      .withIndex("by_billingPeriod_userId", (q) =>
        q.eq("billingPeriod", billingPeriod).eq("userId", args.userId)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        inputTokens: existing.inputTokens + args.inputTokens,
        outputTokens: existing.outputTokens + args.outputTokens,
        totalTokens: existing.totalTokens + args.totalTokens,
        generations: existing.generations + 1,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("aiUsageTotals", {
        userId: args.userId,
        billingPeriod,
        inputTokens: args.inputTokens,
        outputTokens: args.outputTokens,
        totalTokens: args.totalTokens,
        generations: 1,
        updatedAt: now,
      });
    }
  },
});

/**
 * Attached to the Mora agent: after each generation, record token usage to the
 * aiUsage table and reserve it against the per-user token budget (reserve:true
 * allows a temporary negative balance, blocking further requests until repaid).
 */
export const moraUsageHandler: UsageHandler = async (ctx, args) => {
  const { userId, threadId, agentName, model, provider, usage } = args;
  if (!userId) return;

  await ctx.runMutation(internal.usage.insertUsage, {
    userId,
    agentName,
    model,
    provider,
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    totalTokens: usage.totalTokens ?? 0,
    threadId,
  });

  // Reserve the spent tokens against both the per-user and global token
  // budgets. reserve:true drives the bucket negative when over budget; the
  // up-front gates in moraChat.streamChat then block the next request until
  // the bucket refills ("blocking further requests until repaid").
  const tokens = usage.totalTokens ?? 0;
  const perUser = await rateLimiter.limit(ctx, "tokenUsagePerUser", {
    key: userId,
    count: tokens,
    reserve: true,
  });
  const global = await rateLimiter.limit(ctx, "globalTokenUsage", {
    count: tokens,
    reserve: true,
  });

  // reserve:true never rejects here (it drives the bucket negative so the
  // up-front gates in streamChat block the next request). Surface the result
  // rather than ignoring it: a retryAfter means the budget is now exhausted.
  if (!perUser.ok || perUser.retryAfter) {
    console.warn(
      `[mora] per-user token budget exhausted for ${userId}; next request blocked for ~${perUser.retryAfter ?? 0}ms`
    );
  }
  if (!global.ok || global.retryAfter) {
    console.warn(
      `[mora] global token budget exhausted; next request blocked for ~${global.retryAfter ?? 0}ms`
    );
  }
};

/** Current billing period's token usage for the authenticated user. */
export const getMyUsage = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const period = new Date().toISOString().slice(0, 7);
    const row = await ctx.db
      .query("aiUsageTotals")
      .withIndex("by_billingPeriod_userId", (q) =>
        q.eq("billingPeriod", period).eq("userId", user._id)
      )
      .unique();
    return {
      billingPeriod: period,
      inputTokens: row?.inputTokens ?? 0,
      outputTokens: row?.outputTokens ?? 0,
      totalTokens: row?.totalTokens ?? 0,
      generations: row?.generations ?? 0,
    };
  },
});
