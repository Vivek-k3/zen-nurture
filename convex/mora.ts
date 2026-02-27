import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const MORA_SETTINGS_KEY = "mora.config";
const DEFAULT_ALLOWED_SCOPES = ["events", "reminders", "notes"] as const;

type MoraSettings = {
  enabled: boolean;
  yoloMode: boolean;
  allowWrites: boolean;
  allowedWriteScopes: string[];
  updatedAt: string;
};

function defaultSettings(): MoraSettings {
  return {
    enabled: true,
    yoloMode: false,
    allowWrites: true,
    allowedWriteScopes: [...DEFAULT_ALLOWED_SCOPES],
    updatedAt: new Date().toISOString(),
  };
}

async function getSettingsDoc(ctx: any) {
  const rows = await ctx.db
    .query("settings")
    .withIndex("by_key", (q: any) => q.eq("key", MORA_SETTINGS_KEY))
    .take(1);
  return rows[0] ?? null;
}

async function getResolvedSettings(ctx: any): Promise<MoraSettings> {
  const doc = await getSettingsDoc(ctx);
  return doc?.value ? { ...defaultSettings(), ...doc.value } : defaultSettings();
}

async function getLatestBabyProfileId(ctx: any) {
  const rows = await ctx.db.query("babyProfiles").order("desc").take(1);
  return rows[0]?._id ?? null;
}

function inferScope(actionType: string): "events" | "reminders" | "notes" | "unknown" {
  if (actionType.startsWith("event.")) return "events";
  if (actionType.startsWith("reminder.")) return "reminders";
  if (actionType === "note.create") return "notes";
  return "unknown";
}

export const getMoraSettings = query({
  args: {},
  handler: async (ctx) => {
    return await getResolvedSettings(ctx);
  },
});

export const updateMoraSettings = mutation({
  args: {
    enabled: v.optional(v.boolean()),
    yoloMode: v.optional(v.boolean()),
    allowWrites: v.optional(v.boolean()),
    allowedWriteScopes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const current = await getResolvedSettings(ctx);
    const next = {
      ...current,
      ...args,
      updatedAt: new Date().toISOString(),
    };
    const existing = await getSettingsDoc(ctx);
    if (existing) {
      await ctx.db.patch(existing._id, { value: next });
      return next;
    }
    await ctx.db.insert("settings", { key: MORA_SETTINGS_KEY, value: next });
    return next;
  },
});

export const getOrCreateMoraThread = mutation({
  args: {
    babyId: v.optional(v.id("babyProfiles")),
  },
  handler: async (ctx, args) => {
    const babyId = args.babyId ?? (await getLatestBabyProfileId(ctx)) ?? undefined;
    const existing = babyId
      ? await ctx.db
          .query("moraThreads")
          .withIndex("by_babyId_lastMessageAt", (q) => q.eq("babyId", babyId))
          .order("desc")
          .take(1)
      : [];

    if (existing[0] && existing[0].status === "active") {
      return existing[0];
    }

    const now = new Date().toISOString();
    const threadId = await ctx.db.insert("moraThreads", {
      babyId,
      title: "Mora Assistant",
      status: "active",
      lastMessageAt: now,
      createdAt: now,
    });

    const thread = await ctx.db.get(threadId);
    return thread;
  },
});

export const closeMoraThread = mutation({
  args: { threadId: v.id("moraThreads") },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) return;
    await ctx.db.patch(args.threadId, { status: "closed" });
  },
});

export const listMoraMessages = query({
  args: {
    threadId: v.id("moraThreads"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 100, 500);
    const rows = await ctx.db
      .query("moraMessages")
      .withIndex("by_threadId_createdAt", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .take(limit);
    return {
      cursor: null,
      page: rows,
    };
  },
});

export const listPendingMoraActions = query({
  args: {
    threadId: v.id("moraThreads"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("moraActions")
      .withIndex("by_threadId_createdAt", (q) => q.eq("threadId", args.threadId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("desc")
      .collect();
  },
});

export const createMoraMessage = mutation({
  args: {
    threadId: v.id("moraThreads"),
    role: v.string(),
    parts: v.any(),
    text: v.optional(v.string()),
    routeContext: v.optional(
      v.object({
        pathname: v.string(),
        pageLabel: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const id = await ctx.db.insert("moraMessages", {
      ...args,
      createdAt: now,
    });
    await ctx.db.patch(args.threadId, {
      lastMessageAt: now,
    });
    return id;
  },
});

export const createPendingMoraAction = mutation({
  args: {
    threadId: v.id("moraThreads"),
    actionType: v.string(),
    payload: v.any(),
    preview: v.string(),
    requiresApproval: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const id = await ctx.db.insert("moraActions", {
      ...args,
      status: args.requiresApproval ? "pending" : "approved",
      approvedAt: args.requiresApproval ? undefined : now,
      createdAt: now,
    });
    await ctx.db.patch(args.threadId, { lastMessageAt: now });
    return await ctx.db.get(id);
  },
});

export const approveMoraAction = mutation({
  args: { actionId: v.id("moraActions") },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.actionId);
    if (!action) throw new Error("Action not found");
    if (action.status !== "pending") return action;
    const now = new Date().toISOString();
    await ctx.db.patch(args.actionId, { status: "approved", approvedAt: now });
    return await ctx.db.get(args.actionId);
  },
});

export const rejectMoraAction = mutation({
  args: {
    actionId: v.id("moraActions"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.actionId);
    if (!action) throw new Error("Action not found");
    await ctx.db.patch(args.actionId, {
      status: "rejected",
      error: args.reason ?? "Rejected by user",
    });
    return await ctx.db.get(args.actionId);
  },
});

export const markMoraActionExecuted = mutation({
  args: {
    actionId: v.id("moraActions"),
    result: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    await ctx.db.patch(args.actionId, {
      status: "executed",
      executedAt: now,
      result: args.result,
      error: undefined,
    });
    return await ctx.db.get(args.actionId);
  },
});

export const markMoraActionFailed = mutation({
  args: {
    actionId: v.id("moraActions"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.actionId, {
      status: "failed",
      error: args.error,
    });
    return await ctx.db.get(args.actionId);
  },
});

export const executeApprovedMoraAction = mutation({
  args: {
    actionId: v.id("moraActions"),
  },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.actionId);
    if (!action) throw new Error("Action not found");
    if (!["approved", "pending"].includes(action.status)) {
      throw new Error(`Action status ${action.status} cannot be executed`);
    }

    const settings = await getResolvedSettings(ctx);
    if (!settings.enabled) throw new Error("Mora is disabled");
    if (!settings.allowWrites) throw new Error("Mora writes are disabled");

    const scope = inferScope(action.actionType);
    if (scope === "unknown" || !settings.allowedWriteScopes.includes(scope)) {
      throw new Error(`Action scope not allowed: ${scope}`);
    }

    const payload = (action.payload ?? {}) as Record<string, any>;
    const now = new Date().toISOString();

    let entityId: string | undefined;

    if (action.actionType === "event.create") {
      const babyId = payload.babyId ?? (await getLatestBabyProfileId(ctx));
      if (!babyId) throw new Error("No baby profile available");
      entityId = await ctx.db.insert("events", {
        babyId,
        type: payload.type,
        timestamp: payload.timestamp ?? now,
        caregiverId: payload.caregiverId,
        payload: payload.payload ?? {},
        source: "mora",
        createdAt: now,
      });
    } else if (action.actionType === "note.create") {
      const babyId = payload.babyId ?? (await getLatestBabyProfileId(ctx));
      if (!babyId) throw new Error("No baby profile available");
      entityId = await ctx.db.insert("events", {
        babyId,
        type: "NOTE",
        timestamp: payload.timestamp ?? now,
        payload: { text: payload.text ?? "" },
        source: "mora",
        createdAt: now,
      });
    } else if (action.actionType === "event.update") {
      if (!payload.id) throw new Error("event.update missing id");
      const existing: any = await ctx.db.get(payload.id);
      if (!existing) throw new Error("Event not found");
      await ctx.db.patch(payload.id, {
        timestamp: payload.timestamp ?? existing.timestamp,
        caregiverId: payload.caregiverId ?? existing.caregiverId,
        payload: payload.payload ?? existing.payload,
        updatedAt: now,
      });
      entityId = payload.id;
    } else if (action.actionType === "event.delete") {
      if (!payload.id) throw new Error("event.delete missing id");
      await ctx.db.delete(payload.id);
      entityId = payload.id;
    } else if (action.actionType === "reminder.create") {
      const babyId = payload.babyId ?? (await getLatestBabyProfileId(ctx));
      if (!babyId) throw new Error("No baby profile available");
      entityId = await ctx.db.insert("reminderRules", {
        babyId,
        category: payload.category ?? "custom",
        title: payload.title ?? "Reminder",
        triggerType: payload.triggerType ?? "fixedTimes",
        triggerConfig: payload.triggerConfig ?? { times: ["09:00"] },
        enabled: payload.enabled ?? true,
        quietHoursStart: payload.quietHoursStart,
        quietHoursEnd: payload.quietHoursEnd,
        snoozeOptions: payload.snoozeOptions,
        createdAt: now,
      });
    } else if (action.actionType === "reminder.update") {
      if (!payload.id) throw new Error("reminder.update missing id");
      const { id, ...updates } = payload;
      await ctx.db.patch(id as any, updates);
      entityId = id;
    } else if (action.actionType === "reminder.delete") {
      if (!payload.id) throw new Error("reminder.delete missing id");
      await ctx.db.delete(payload.id as any);
      entityId = payload.id;
    } else {
      throw new Error(`Unsupported action type: ${action.actionType}`);
    }

    const result = {
      status: "executed" as const,
      actionId: action._id,
      entityId,
      summary: `${action.actionType} executed`,
    };

    await ctx.db.patch(action._id, {
      status: "executed",
      executedAt: now,
      result,
      error: undefined,
    });

    return result;
  },
});
