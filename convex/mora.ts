import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireAuth, requireBabyAccess } from "./lib/auth";
import { getActiveBabyIdForUser } from "./lib/baby";

const MORA_SETTINGS_KEY = "mora.config";

type MoraSettings = {
  enabled: boolean;
  updatedAt: string;
};

function defaultSettings(): MoraSettings {
  return { enabled: true, updatedAt: new Date().toISOString() };
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

export const getMoraSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await getResolvedSettings(ctx);
  },
});

export const updateMoraSettings = mutation({
  args: { enabled: v.optional(v.boolean()) },
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
// Mora writes. Mora is a single natural agent — there are no modes and no
// approval gate. Write tools call `moraWrite`, which applies the change
// directly and returns the result for Mora to report in its reply.
// ---------------------------------------------------------------------------

type WriteResult = { status: "done"; entityId?: string; summary: string };

async function applyMoraWrite(
  ctx: MutationCtx,
  userId: string,
  actionType: string,
  payload: Record<string, any>
): Promise<WriteResult> {
  const now = new Date().toISOString();
  let entityId: string | undefined;

  if (actionType === "event.create") {
    const babyId = payload.babyId ?? (await getActiveBabyIdForUser(ctx, userId));
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
  } else if (actionType === "note.create") {
    const babyId = payload.babyId ?? (await getActiveBabyIdForUser(ctx, userId));
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
  } else if (actionType === "event.update") {
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
  } else if (actionType === "event.delete") {
    if (!payload.id) throw new Error("event.delete missing id");
    const existing = await ctx.db.get(payload.id as Id<"events">);
    if (!existing) throw new Error("Event not found");
    await requireBabyAccess(ctx, existing.babyId, userId);
    await ctx.db.delete(payload.id as Id<"events">);
    entityId = payload.id;
  } else if (actionType === "reminder.create") {
    const babyId = payload.babyId ?? (await getActiveBabyIdForUser(ctx, userId));
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
  } else if (actionType === "reminder.update") {
    if (!payload.id) throw new Error("reminder.update missing id");
    const existing = await ctx.db.get(payload.id as Id<"reminderRules">);
    if (!existing) throw new Error("Reminder not found");
    await requireBabyAccess(ctx, existing.babyId, userId);
    // Whitelist mutable fields only. payload is v.any() from the client, so a
    // blind spread would let it overwrite babyId (moving the reminder to
    // another baby, unauthorized) or tamper with createdAt.
    const REMINDER_UPDATABLE = [
      "category",
      "title",
      "triggerType",
      "triggerConfig",
      "enabled",
      "quietHoursStart",
      "quietHoursEnd",
      "snoozeOptions",
    ] as const;
    const updates: Record<string, any> = {};
    for (const key of REMINDER_UPDATABLE) {
      if (payload[key] !== undefined) updates[key] = payload[key];
    }
    await ctx.db.patch(payload.id as Id<"reminderRules">, updates);
    entityId = payload.id;
  } else if (actionType === "reminder.delete") {
    if (!payload.id) throw new Error("reminder.delete missing id");
    const existing = await ctx.db.get(payload.id as Id<"reminderRules">);
    if (!existing) throw new Error("Reminder not found");
    await requireBabyAccess(ctx, existing.babyId, userId);
    await ctx.db.delete(payload.id as Id<"reminderRules">);
    entityId = payload.id;
  } else {
    throw new Error(`Unsupported action type: ${actionType}`);
  }

  return { status: "done", entityId, summary: `${actionType.replace(/\./g, " ")} done` };
}

/** Entry point used by Mora write tools: apply a write immediately. */
export const moraWrite = mutation({
  args: {
    actionType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args): Promise<WriteResult | { status: "blocked"; reason: string }> => {
    const user = await requireAuth(ctx);
    const settings = await getResolvedSettings(ctx);
    if (!settings.enabled) return { status: "blocked", reason: "Mora is disabled in Settings." };
    return await applyMoraWrite(ctx, user._id, args.actionType, (args.payload ?? {}) as Record<string, any>);
  },
});
