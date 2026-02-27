import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

async function requireAuth(ctx: any) {
  const user = await authComponent.safeGetAuthUser(ctx);
  if (!user) throw new Error("Unauthenticated");
  return user;
}

export const listMyFamilies = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];

    const memberships = await ctx.db
      .query("familyMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const families = await Promise.all(
      memberships.map(async (m) => {
        const family = await ctx.db.get(m.familyId);
        return family ? { ...family, role: m.role } : null;
      })
    );

    return families.filter(Boolean);
  },
});

export const getFamily = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return null;

    const membership = await ctx.db
      .query("familyMembers")
      .withIndex("by_familyId_userId", (q) =>
        q.eq("familyId", args.familyId).eq("userId", user._id)
      )
      .first();

    if (!membership) return null;

    const family = await ctx.db.get(args.familyId);
    return family ? { ...family, role: membership.role } : null;
  },
});

export const createFamily = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const now = new Date().toISOString();

    const familyId = await ctx.db.insert("families", {
      name: args.name,
      ownerId: user._id,
      createdAt: now,
    });

    await ctx.db.insert("familyMembers", {
      familyId,
      userId: user._id,
      role: "owner",
      joinedAt: now,
    });

    return familyId;
  },
});

export const listFamilyMembers = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];

    const myMembership = await ctx.db
      .query("familyMembers")
      .withIndex("by_familyId_userId", (q) =>
        q.eq("familyId", args.familyId).eq("userId", user._id)
      )
      .first();

    if (!myMembership) return [];

    const members = await ctx.db
      .query("familyMembers")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .collect();

    const enriched = await Promise.all(
      members.map(async (m) => {
        const memberUser = await authComponent.getAnyUserById(ctx, m.userId);
        return {
          ...m,
          userName: memberUser?.name ?? "Unknown",
          userEmail: memberUser?.email ?? "",
        };
      })
    );

    return enriched;
  },
});

export const inviteCaregiver = mutation({
  args: {
    familyId: v.id("families"),
    email: v.string(),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const membership = await ctx.db
      .query("familyMembers")
      .withIndex("by_familyId_userId", (q) =>
        q.eq("familyId", args.familyId).eq("userId", user._id)
      )
      .first();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("Only owners and admins can invite caregivers");
    }

    const existing = await ctx.db
      .query("familyInvitations")
      .withIndex("by_email_status", (q) =>
        q.eq("email", args.email).eq("status", "pending")
      )
      .collect();

    const alreadyInvited = existing.find((i) => i.familyId === args.familyId);
    if (alreadyInvited) {
      throw new Error("This email has already been invited to this family");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const inviteId = await ctx.db.insert("familyInvitations", {
      familyId: args.familyId,
      email: args.email,
      role: args.role ?? "caregiver",
      invitedBy: user._id,
      status: "pending",
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    return inviteId;
  },
});

export const listPendingInvitations = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];

    const membership = await ctx.db
      .query("familyMembers")
      .withIndex("by_familyId_userId", (q) =>
        q.eq("familyId", args.familyId).eq("userId", user._id)
      )
      .first();

    if (!membership) return [];

    return await ctx.db
      .query("familyInvitations")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});

export const listMyInvitations = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];

    const invitations = await ctx.db
      .query("familyInvitations")
      .withIndex("by_email_status", (q) =>
        q.eq("email", user.email).eq("status", "pending")
      )
      .collect();

    const enriched = await Promise.all(
      invitations.map(async (inv) => {
        const family = await ctx.db.get(inv.familyId);
        return { ...inv, familyName: family?.name ?? "Unknown" };
      })
    );

    return enriched;
  },
});

export const acceptInvitation = mutation({
  args: { invitationId: v.id("familyInvitations") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");
    if (invitation.status !== "pending") throw new Error("Invitation is no longer pending");
    if (invitation.email !== user.email) throw new Error("This invitation is for a different email");

    if (new Date(invitation.expiresAt) < new Date()) {
      await ctx.db.patch(args.invitationId, { status: "expired" });
      throw new Error("Invitation has expired");
    }

    const existing = await ctx.db
      .query("familyMembers")
      .withIndex("by_familyId_userId", (q) =>
        q.eq("familyId", invitation.familyId).eq("userId", user._id)
      )
      .first();

    if (existing) {
      await ctx.db.patch(args.invitationId, { status: "accepted" });
      return existing.familyId;
    }

    await ctx.db.insert("familyMembers", {
      familyId: invitation.familyId,
      userId: user._id,
      role: invitation.role,
      joinedAt: new Date().toISOString(),
    });

    await ctx.db.patch(args.invitationId, { status: "accepted" });

    return invitation.familyId;
  },
});

export const declineInvitation = mutation({
  args: { invitationId: v.id("familyInvitations") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");
    if (invitation.email !== user.email) throw new Error("Not your invitation");

    await ctx.db.patch(args.invitationId, { status: "declined" });
  },
});

export const removeFamilyMember = mutation({
  args: {
    familyId: v.id("families"),
    memberId: v.id("familyMembers"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const myMembership = await ctx.db
      .query("familyMembers")
      .withIndex("by_familyId_userId", (q) =>
        q.eq("familyId", args.familyId).eq("userId", user._id)
      )
      .first();

    if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
      throw new Error("Only owners and admins can remove members");
    }

    const target = await ctx.db.get(args.memberId);
    if (!target || target.familyId !== args.familyId) {
      throw new Error("Member not found in this family");
    }
    if (target.role === "owner") {
      throw new Error("Cannot remove the family owner");
    }

    await ctx.db.delete(args.memberId);
  },
});
