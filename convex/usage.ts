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
    await ctx.db.insert("aiUsage", {
      ...args,
      billingPeriod: now.slice(0, 7), // "YYYY-MM"
      createdAt: now,
    });
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

  await rateLimiter.limit(ctx, "tokenUsagePerUser", {
    key: userId,
    count: usage.totalTokens ?? 0,
    reserve: true,
  });
};

/** Current billing period's token usage for the authenticated user. */
export const getMyUsage = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const period = new Date().toISOString().slice(0, 7);
    const rows = await ctx.db
      .query("aiUsage")
      .withIndex("by_billingPeriod_userId", (q) =>
        q.eq("billingPeriod", period).eq("userId", user._id)
      )
      .collect();
    const totals = rows.reduce(
      (acc, r) => {
        acc.inputTokens += r.inputTokens;
        acc.outputTokens += r.outputTokens;
        acc.totalTokens += r.totalTokens;
        acc.generations += 1;
        return acc;
      },
      { inputTokens: 0, outputTokens: 0, totalTokens: 0, generations: 0 }
    );
    return { billingPeriod: period, ...totals };
  },
});
