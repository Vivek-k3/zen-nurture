import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { saveMessage, getThreadMetadata } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { requireAuth, requireBabyAccess, getUserFamilyIds } from "./lib/auth";

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

async function getSettingsDoc(ctx: Parameters<typeof requireAuth>[0]) {
  const rows = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", MORA_SETTINGS_KEY))
    .take(1);
  return rows[0] ?? null;
}

async function getResolvedSettings(
  ctx: Parameters<typeof requireAuth>[0]
): Promise<MoraSettings> {
  const doc = await getSettingsDoc(ctx);
  return doc?.value ? { ...defaultSettings(), ...doc.value } : defaultSettings();
}

async function getLatestBabyProfileIdForUser(
  ctx: Parameters<typeof getUserFamilyIds>[0],
  userId: string
): Promise<Id<"babyProfiles"> | null> {
  const familyIds = await getUserFamilyIds(ctx, userId);
  if (familyIds.length === 0) return null;
  for (const familyId of familyIds) {
    const rows = await ctx.db
      .query("babyProfiles")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .order("desc")
      .take(1);
    if (rows[0]) return rows[0]._id;
  }
  return null;
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
    await requireAuth(ctx);
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
    await requireAuth(ctx);
    const current = await getResolvedSettings(ctx);
    const next = { ...current, ...args, updatedAt: new Date().toISOString() };
    const existing = await getSettingsDoc(ctx);
    if (existing) {
      await ctx.db.patch(existing._id, { value: next });
      return next;
    }
    await ctx.db.insert("settings", { key: MORA_SETTINGS_KEY, value: next });
    return next;
  },
});

// ---------------------------------------------------------------------------
// Approval gate for Mora-proposed writes.
//
// Write tools (in moraAgent) call `queueMoraWrite`, which records a moraActions
// row scoped to the agent thread + user. In Safe mode (or for any delete) the
// row is `pending` and surfaces as an approval card; in YOLO mode non-delete
// writes execute immediately. `approveMoraAction` runs the queued change.
// ---------------------------------------------------------------------------

type ExecuteResult = {
  status: "executed";
  actionId: Id<"moraActions">;
  entityId?: string;
  summary: string;
};

/** Applies a queued action to the database and notes the outcome in the thread. */
async function executeAction(
  ctx: MutationCtx,
  userId: string,
  actionId: Id<"moraActions">
): Promise<ExecuteResult> {
  const action = await ctx.db.get(actionId);
  if (!action) throw new Error("Action not found");

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
    const babyId = payload.babyId ?? (await getLatestBabyProfileIdForUser(ctx, userId));
    if (!babyId) throw new Error("No baby profile available");
    await requireBabyAccess(ctx, babyId as Id<"babyProfiles">, userId);
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
    const babyId = payload.babyId ?? (await getLatestBabyProfileIdForUser(ctx, userId));
    if (!babyId) throw new Error("No baby profile available");
    await requireBabyAccess(ctx, babyId as Id<"babyProfiles">, userId);
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
    const existing = await ctx.db.get(payload.id as Id<"events">);
    if (!existing) throw new Error("Event not found");
    await requireBabyAccess(ctx, existing.babyId, userId);
    await ctx.db.patch(payload.id, {
      timestamp: payload.timestamp ?? existing.timestamp,
      caregiverId: payload.caregiverId ?? existing.caregiverId,
      payload: payload.payload ?? existing.payload,
      updatedAt: now,
    });
    entityId = payload.id;
  } else if (action.actionType === "event.delete") {
    if (!payload.id) throw new Error("event.delete missing id");
    const existing = await ctx.db.get(payload.id as Id<"events">);
    if (!existing) throw new Error("Event not found");
    await requireBabyAccess(ctx, existing.babyId, userId);
    await ctx.db.delete(payload.id as Id<"events">);
    entityId = payload.id;
  } else if (action.actionType === "reminder.create") {
    const babyId = payload.babyId ?? (await getLatestBabyProfileIdForUser(ctx, userId));
    if (!babyId) throw new Error("No baby profile available");
    await requireBabyAccess(ctx, babyId as Id<"babyProfiles">, userId);
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
    const existing = await ctx.db.get(payload.id as Id<"reminderRules">);
    if (!existing) throw new Error("Reminder not found");
    await requireBabyAccess(ctx, existing.babyId, userId);
    const { id, ...updates } = payload;
    await ctx.db.patch(id as Id<"reminderRules">, updates);
    entityId = id;
  } else if (action.actionType === "reminder.delete") {
    if (!payload.id) throw new Error("reminder.delete missing id");
    const existing = await ctx.db.get(payload.id as Id<"reminderRules">);
    if (!existing) throw new Error("Reminder not found");
    await requireBabyAccess(ctx, existing.babyId, userId);
    await ctx.db.delete(payload.id as Id<"reminderRules">);
    entityId = payload.id;
  } else {
    throw new Error(`Unsupported action type: ${action.actionType}`);
  }

  const summary = `${action.actionType.replace(/\./g, " ")} done`;
  const result: ExecuteResult = {
    status: "executed",
    actionId: action._id,
    entityId,
    summary,
  };

  await ctx.db.patch(action._id, {
    status: "executed",
    executedAt: now,
    result,
    error: undefined,
  });

  // Surface the outcome in the agent thread (non-fatal if it fails).
  try {
    await saveMessage(ctx, components.agent, {
      threadId: action.threadId,
      userId,
      message: { role: "assistant", content: `✓ ${summary}` },
    });
  } catch {
    // The write already succeeded; a missing thread note is not fatal.
  }

  return result;
}

async function verifyMoraActionAccess(ctx: MutationCtx, actionId: Id<"moraActions">) {
  const user = await requireAuth(ctx);
  const action = await ctx.db.get(actionId);
  if (!action) throw new Error("Action not found");
  if (action.userId !== user._id) throw new Error("Not authorized");
  return { user, action };
}

/** Entry point used by Mora write tools: queue (Safe) or execute (YOLO) a write. */
export const queueMoraWrite = mutation({
  args: {
    threadId: v.string(),
    actionType: v.string(),
    payload: v.any(),
    preview: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    status: string;
    reason?: string;
    actionId?: Id<"moraActions">;
    preview?: string;
  }> => {
    const user = await requireAuth(ctx);
    const meta = await getThreadMetadata(ctx, components.agent, {
      threadId: args.threadId,
    });
    if (meta.userId && meta.userId !== user._id) {
      return { status: "blocked", reason: "Not authorized for this thread." };
    }

    const settings = await getResolvedSettings(ctx);
    if (!settings.enabled) return { status: "blocked", reason: "Mora is disabled in Settings." };
    if (!settings.allowWrites) {
      return { status: "blocked", reason: "Mora writes are disabled in Settings." };
    }
    const scope = inferScope(args.actionType);
    if (scope === "unknown" || !settings.allowedWriteScopes.includes(scope)) {
      return { status: "blocked", reason: `Write scope '${scope}' is not allowed.` };
    }

    const isDelete = args.actionType.includes("delete");
    // Deletes always require explicit human approval, even in YOLO mode.
    const requiresApproval = isDelete || !settings.yoloMode;
    const now = new Date().toISOString();

    const actionId = await ctx.db.insert("moraActions", {
      threadId: args.threadId,
      userId: user._id,
      status: requiresApproval ? "pending" : "approved",
      actionType: args.actionType,
      payload: args.payload,
      preview: args.preview,
      requiresApproval,
      approvedAt: requiresApproval ? undefined : now,
      createdAt: now,
    });

    if (!requiresApproval) {
      await executeAction(ctx, user._id, actionId);
      return { status: "executed", actionId, preview: args.preview };
    }
    return { status: "pending_approval", actionId, preview: args.preview };
  },
});

/** Pending approval cards for a thread (scoped to the authenticated user). */
export const listPendingMoraActions = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const rows = await ctx.db
      .query("moraActions")
      .withIndex("by_threadId_status_createdAt", (q) =>
        q.eq("threadId", args.threadId).eq("status", "pending")
      )
      .order("desc")
      .collect();
    return rows.filter((r) => r.userId === user._id);
  },
});

/** Approve and apply a pending action. */
export const approveMoraAction = mutation({
  args: { actionId: v.id("moraActions") },
  handler: async (ctx, args): Promise<ExecuteResult> => {
    const { user, action } = await verifyMoraActionAccess(ctx, args.actionId);
    if (action.status === "executed" && action.result) {
      return action.result as ExecuteResult;
    }
    if (!["approved", "pending"].includes(action.status)) {
      throw new Error(`Action status ${action.status} cannot be executed`);
    }
    return await executeAction(ctx, user._id, args.actionId);
  },
});

/** Reject a pending action. */
export const rejectMoraAction = mutation({
  args: { actionId: v.id("moraActions"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { action } = await verifyMoraActionAccess(ctx, args.actionId);
    await ctx.db.patch(action._id, {
      status: "rejected",
      error: args.reason ?? "Rejected by user",
    });
    return await ctx.db.get(action._id);
  },
});
