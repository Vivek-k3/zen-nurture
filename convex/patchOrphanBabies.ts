import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * One-off migration: assign orphan babyProfiles (missing familyId) to a family.
 * Run from Convex dashboard or via `npx convex run patchOrphanBabies:assignOrphansToFirstFamily`
 * (internal - not callable from client).
 */
export const assignOrphansToFirstFamily = internalMutation({
  args: { targetFamilyId: v.optional(v.id("families")) },
  handler: async (ctx, args) => {
    const families = await ctx.db.query("families").collect();
    if (families.length === 0) {
      throw new Error("No family exists. Create a family first, then run this again.");
    }

    let targetFamilyId;
    if (families.length === 1) {
      targetFamilyId = families[0]._id;
    } else {
      if (!args.targetFamilyId) {
        throw new Error(
          "Multiple families exist. Specify explicit targetFamilyId to assign orphans."
        );
      }
      const targetFamily = families.find((family) => family._id === args.targetFamilyId);
      if (!targetFamily) {
        throw new Error("Specified targetFamilyId does not exist.");
      }
      targetFamilyId = targetFamily._id;
    }

    const all = await ctx.db.query("babyProfiles").collect();
    const orphans = all.filter((b) => b.familyId === undefined);
    for (const baby of orphans) {
      await ctx.db.patch(baby._id, { familyId: targetFamilyId });
    }
    return { patched: orphans.length, familyId: targetFamilyId };
  },
});
