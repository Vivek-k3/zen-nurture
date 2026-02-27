import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { authComponent } from "../auth";

type Ctx = QueryCtx | MutationCtx;

export async function requireAuth(ctx: Ctx) {
  const user = await authComponent.safeGetAuthUser(ctx);
  if (!user) throw new Error("Unauthenticated");
  return user;
}

export async function getUserFamilyIds(ctx: Ctx, userId: string) {
  const memberships = await ctx.db
    .query("familyMembers")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
  return memberships.map((m) => m.familyId);
}

export async function requireBabyAccess(
  ctx: Ctx,
  babyId: Id<"babyProfiles">,
  userId: string
): Promise<void> {
  const baby = await ctx.db.get(babyId);
  if (!baby?.familyId) throw new Error("Baby not found");
  const familyIds = await getUserFamilyIds(ctx, userId);
  if (!familyIds.includes(baby.familyId)) throw new Error("Not authorized");
}
