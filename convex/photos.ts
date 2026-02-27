import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireBabyAccess } from "./lib/auth";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getUrls = query({
  args: { storageIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const urls: Record<string, string | null> = {};
    for (const id of args.storageIds) {
      urls[id] = await ctx.storage.getUrl(id);
    }
    return urls;
  },
});

export const attachToEvent = mutation({
  args: {
    eventId: v.id("events"),
    storageIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    await requireBabyAccess(ctx, event.babyId, user._id);

    const existing = event.photoIds ?? [];
    await ctx.db.patch(args.eventId, {
      photoIds: [...existing, ...args.storageIds],
    });
  },
});

export const removeFromEvent = mutation({
  args: {
    eventId: v.id("events"),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    await requireBabyAccess(ctx, event.babyId, user._id);

    const existing: string[] = event.photoIds ?? [];
    await ctx.db.patch(args.eventId, {
      photoIds: existing.filter((id) => id !== args.storageId),
    });

    await ctx.storage.delete(args.storageId);
  },
});
