import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  listUIMessages,
  syncStreams,
  vStreamArgs,
  getThreadMetadata,
} from "@convex-dev/agent";
import { components, api } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { moraAgent, MORA_INSTRUCTIONS } from "./moraAgent";
import { rateLimiter } from "./rateLimiter";
import { requireAuth } from "./lib/auth";

const clientContextValidator = v.object({
  pathname: v.optional(v.string()),
  pageLabel: v.optional(v.string()),
  userName: v.optional(v.string()),
  userEmail: v.optional(v.string()),
  familyName: v.optional(v.string()),
  babyName: v.optional(v.string()),
  babyDob: v.optional(v.string()),
  babyTimezone: v.optional(v.string()),
});

type ClientContext = {
  pathname?: string;
  pageLabel?: string;
  userName?: string;
  userEmail?: string;
  familyName?: string;
  babyName?: string;
  babyDob?: string;
  babyTimezone?: string;
};

/** Tiny helper so an action can resolve (and enforce) the authenticated user. */
export const getMyUserId = query({
  args: {},
  handler: async (ctx): Promise<string> => {
    const user = await requireAuth(ctx);
    return user._id as string;
  },
});

/** Create a new Mora thread owned by the authenticated user. */
export const createThread = mutation({
  args: { title: v.optional(v.string()) },
  handler: async (ctx, { title }): Promise<string> => {
    const user = await requireAuth(ctx);
    const { threadId } = await moraAgent.createThread(ctx, {
      userId: user._id,
      title: title ?? "Mora Assistant",
    });
    return threadId;
  },
});

/** Build the per-request system prompt: static instructions + live context. */
async function buildSystemPrompt(
  ctx: ActionCtx,
  clientContext: ClientContext,
  settings: { enabled: boolean; yoloMode: boolean; allowWrites: boolean }
): Promise<string> {
  const baby = await ctx.runQuery(api.events.getBabyProfile, {});
  let recentCount = 0;
  let upcomingCount = 0;
  if (baby?._id) {
    const recent = await ctx.runQuery(api.events.listEvents, {
      babyId: baby._id,
      from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
      limit: 20,
    });
    recentCount = recent?.length ?? 0;
    const upcoming = await ctx.runQuery(api.events.computeUpcomingReminders, {
      babyId: baby._id,
    });
    upcomingCount = upcoming?.length ?? 0;
  }

  return [
    MORA_INSTRUCTIONS,
    "",
    "## Current Context",
    `- User: ${clientContext.userName || "Unknown"} (${clientContext.userEmail || "unknown"})`,
    `- Family: ${clientContext.familyName || "Unknown"}`,
    `- Baby: ${clientContext.babyName || baby?.name || "Unknown"}${clientContext.babyDob ? ` (DOB: ${clientContext.babyDob})` : ""}`,
    `- Timezone: ${clientContext.babyTimezone || baby?.timezone || "Asia/Kolkata"}`,
    `- Page: ${clientContext.pageLabel ?? "Unknown"} (${clientContext.pathname ?? "/"})`,
    `- Mora settings: enabled=${settings.enabled}, yoloMode=${settings.yoloMode}, allowWrites=${settings.allowWrites}`,
    `- Recent events (24h): ${recentCount}`,
    `- Upcoming reminders: ${upcomingCount}`,
  ].join("\n");
}

/**
 * Authenticated streaming action. Runs the agent with the user's identity so
 * the read tools reuse the existing auth-enforcing queries. Response deltas are
 * persisted via saveStreamDeltas; clients subscribe through listThreadMessages.
 */
export const streamChat = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    clientContext: v.optional(clientContextValidator),
  },
  handler: async (ctx, { threadId, prompt, clientContext }): Promise<void> => {
    const userId = await ctx.runQuery(api.moraChat.getMyUserId, {});
    const meta = await getThreadMetadata(ctx, components.agent, { threadId });
    if (meta.userId && meta.userId !== userId) {
      throw new Error("Not authorized for this thread");
    }

    // Per-user + global request-frequency limits (throws if exceeded).
    await rateLimiter.limit(ctx, "sendMessage", { key: userId, throws: true });
    await rateLimiter.limit(ctx, "globalSendMessage", { throws: true });

    // The "Enable Mora" toggle is authoritative: a disabled Mora must not
    // produce chat responses, even via direct action calls.
    const settings = await ctx.runQuery(api.mora.getMoraSettings, {});
    if (!settings.enabled) throw new Error("Mora is disabled");

    const system = await buildSystemPrompt(ctx, clientContext ?? {}, settings);

    const result = await moraAgent.streamText(
      ctx,
      { threadId },
      { prompt, system },
      { saveStreamDeltas: { chunking: "word", throttleMs: 100 } }
    );
    await result.consumeStream();
  },
});

/** Serves both persisted messages and live stream deltas for a thread. */
export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args): Promise<Record<string, unknown>> => {
    const user = await requireAuth(ctx);
    const meta = await getThreadMetadata(ctx, components.agent, {
      threadId: args.threadId,
    });
    if (meta.userId && meta.userId !== user._id) {
      throw new Error("Not authorized for this thread");
    }
    const paginated = await listUIMessages(ctx, components.agent, args);
    const streams = await syncStreams(ctx, components.agent, args);
    return { ...paginated, streams };
  },
});
