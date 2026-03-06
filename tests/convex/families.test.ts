import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { makeConvexTest, setConvexUser } from "../helpers/convex";

describe("Convex families", () => {
  it("creates a family and matching owner membership", async () => {
    const t = makeConvexTest();
    setConvexUser({ _id: "user-1", email: "owner@example.com", name: "Owner" });

    const familyId = await t.mutation(api.families.createFamily, { name: "Zen Family" });
    const families = await t.query(api.families.listMyFamilies, {});
    const memberships = await t.run(async (ctx) => {
      return await ctx.db
        .query("familyMembers")
        .withIndex("by_familyId", (q) => q.eq("familyId", familyId))
        .collect();
    });

    expect(families).toHaveLength(1);
    expect(families[0]).toMatchObject({ _id: familyId, name: "Zen Family", role: "owner" });
    expect(memberships).toHaveLength(1);
    expect(memberships[0]).toMatchObject({
      familyId,
      userId: "user-1",
      role: "owner",
    });
  });

  it("lists only families the current user belongs to", async () => {
    const t = makeConvexTest();
    setConvexUser({ _id: "user-1", email: "owner@example.com", name: "Owner" });

    const ownFamilyId = await t.mutation(api.families.createFamily, { name: "My Family" });
    await t.run(async (ctx) => {
      const otherFamilyId = await ctx.db.insert("families", {
        name: "Other Family",
        ownerId: "user-2",
        createdAt: new Date().toISOString(),
      });
      await ctx.db.insert("familyMembers", {
        familyId: otherFamilyId,
        userId: "user-2",
        role: "owner",
        joinedAt: new Date().toISOString(),
      });
    });

    const families = await t.query(api.families.listMyFamilies, {});

    expect(families).toHaveLength(1);
    expect(families[0]?._id).toBe(ownFamilyId);
  });
});

