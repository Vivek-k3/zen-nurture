import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * One-off migration: assign orphan babyProfiles (missing familyId) to the first family.
 * Run from Convex dashboard if you have schema validation errors from legacy data.
 */
export const assignOrphansToFirstFamily = mutation({
  args: {},
  handler: async (ctx) => {
    const firstFamily = await ctx.db
      .query("families")
      .order("asc")
      .first();
    if (!firstFamily) {
      throw new Error("No family exists. Create a family first, then run this again.");
    }

    const all = await ctx.db.query("babyProfiles").collect();
    const orphans = all.filter((b) => b.familyId === undefined);
    for (const baby of orphans) {
      await ctx.db.patch(baby._id, { familyId: firstFamily._id });
    }
    return { patched: orphans.length, familyId: firstFamily._id };
  },
});
