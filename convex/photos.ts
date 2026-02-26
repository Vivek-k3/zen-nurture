import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId as any);
  },
});

export const getUrls = query({
  args: { storageIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const urls: Record<string, string | null> = {};
    for (const id of args.storageIds) {
      urls[id] = await ctx.storage.getUrl(id as any);
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
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const existing = (event as any).photoIds ?? [];
    await ctx.db.patch(args.eventId, {
      photoIds: [...existing, ...args.storageIds],
    } as any);
  },
});

export const removeFromEvent = mutation({
  args: {
    eventId: v.id("events"),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const existing: string[] = (event as any).photoIds ?? [];
    await ctx.db.patch(args.eventId, {
      photoIds: existing.filter((id) => id !== args.storageId),
    } as any);

    await ctx.storage.delete(args.storageId as any);
  },
});
