import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { getUserFamilyIds } from "./auth";

type Ctx = QueryCtx | MutationCtx;

/** Settings key holding a user's chosen active baby. */
export const activeBabyKey = (userId: string) => `active-baby:${userId}`;

/**
 * The user's active baby — the single source of truth shared by the UI and
 * Mora. Returns the persisted selection (set via `setActiveBaby`) when it's
 * still accessible, otherwise falls back to the newest baby across the user's
 * families (which matches the UI's default of `getBabyProfiles[0]`).
 */
export async function getActiveBabyIdForUser(
  ctx: Ctx,
  userId: string
): Promise<Id<"babyProfiles"> | null> {
  const familyIds = await getUserFamilyIds(ctx, userId);
  if (familyIds.length === 0) return null;

  const row = (
    await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", activeBabyKey(userId)))
      .take(1)
  )[0];
  const savedId = (row?.value as { babyId?: Id<"babyProfiles"> } | undefined)?.babyId;
  if (savedId) {
    const baby = await ctx.db.get(savedId);
    if (baby?.familyId && familyIds.includes(baby.familyId)) return baby._id;
  }

  // Fallback: newest baby across all of the user's families.
  let newest: { _id: Id<"babyProfiles">; createdAt: string } | null = null;
  for (const familyId of familyIds) {
    const profiles = await ctx.db
      .query("babyProfiles")
      .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
      .collect();
    for (const p of profiles) {
      if (!newest || new Date(p.createdAt).getTime() > new Date(newest.createdAt).getTime()) {
        newest = { _id: p._id, createdAt: p.createdAt };
      }
    }
  }
  return newest?._id ?? null;
}
