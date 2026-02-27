import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { authComponent } from "../auth";

type Ctx = QueryCtx | MutationCtx;

/**
 * Ensures the request is authenticated and yields the authenticated user.
 *
 * @returns The authenticated user object.
 * @throws Error if no authenticated user is present with message "Unauthenticated".
 */
export async function requireAuth(ctx: Ctx) {
  const user = await authComponent.safeGetAuthUser(ctx);
  if (!user) throw new Error("Unauthenticated");
  return user;
}

/**
 * Fetches the family IDs associated with a user.
 *
 * @param userId - The id of the user whose family memberships to retrieve
 * @returns An array of family IDs the user is a member of
 */
export async function getUserFamilyIds(ctx: Ctx, userId: string) {
  const memberships = await ctx.db
    .query("familyMembers")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
  return memberships.map((m) => m.familyId);
}

/**
 * Ensure the specified user has access to the given baby profile.
 *
 * @param babyId - The id of the baby profile to check access for.
 * @param userId - The id of the user whose access is being validated.
 * @throws Error "Baby not found" if the baby does not exist or lacks a `familyId`.
 * @throws Error "Not authorized" if the user is not a member of the baby's family.
 */
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
