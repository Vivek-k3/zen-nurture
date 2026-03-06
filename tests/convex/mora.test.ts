import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import {
  createEventForBaby,
  createFamilyAndBaby,
  makeConvexTest,
  setConvexUser,
} from "../helpers/convex";

describe("Convex mora", () => {
  it("creates pending actions, approves them, and executes writes", async () => {
    const t = makeConvexTest();
    setConvexUser({ _id: "user-1", email: "owner@example.com", name: "Owner" });
    const { babyId } = await createFamilyAndBaby(t);

    const thread = await t.mutation(api.mora.getOrCreateMoraThread, { babyId });
    const action = await t.mutation(api.mora.createPendingMoraAction, {
      threadId: thread!._id,
      actionType: "event.create",
      payload: {
        babyId,
        type: "GROWTH",
        timestamp: "2026-03-07T12:00:00.000Z",
        payload: { weightKg: 6.4 },
      },
      preview: "Log weight 6.4kg",
      requiresApproval: true,
    });

    expect(action?.status).toBe("pending");

    const approved = await t.mutation(api.mora.approveMoraAction, {
      actionId: action!._id,
    });
    const result = await t.mutation(api.mora.executeApprovedMoraAction, {
      actionId: action!._id,
    });
    const event = await t.query(api.events.getEvent, { id: result.entityId as any });

    expect(approved?.status).toBe("approved");
    expect(result).toMatchObject({
      status: "executed",
      summary: "event.create executed",
    });
    expect(event).toMatchObject({
      type: "GROWTH",
      source: "mora",
      payload: { weightKg: 6.4 },
    });
  });

  it("blocks invalid event payloads during execution", async () => {
    const t = makeConvexTest();
    setConvexUser({ _id: "user-1", email: "owner@example.com", name: "Owner" });
    const { babyId } = await createFamilyAndBaby(t);
    const thread = await t.mutation(api.mora.getOrCreateMoraThread, { babyId });
    const action = await t.mutation(api.mora.createPendingMoraAction, {
      threadId: thread!._id,
      actionType: "event.create",
      payload: {
        babyId,
        type: "GROWTH",
        timestamp: "2026-03-07T12:00:00.000Z",
        payload: {},
      },
      preview: "Broken growth entry",
      requiresApproval: false,
    });

    await expect(
      t.mutation(api.mora.executeApprovedMoraAction, { actionId: action!._id })
    ).rejects.toThrow("Growth events require at least one measurement");
  });

  it("supports reminder execution and yolo-style approved actions", async () => {
    const t = makeConvexTest();
    setConvexUser({ _id: "user-1", email: "owner@example.com", name: "Owner" });
    const { babyId } = await createFamilyAndBaby(t);
    const thread = await t.mutation(api.mora.getOrCreateMoraThread, { babyId });

    await t.mutation(api.mora.updateMoraSettings, {
      yoloMode: true,
      allowWrites: true,
    });

    const action = await t.mutation(api.mora.createPendingMoraAction, {
      threadId: thread!._id,
      actionType: "reminder.create",
      payload: {
        babyId,
        title: "Feed check",
        category: "feed",
        triggerType: "fixedTimes",
        triggerConfig: { times: ["14:00"] },
      },
      preview: "Create feed reminder",
      requiresApproval: false,
    });

    const result = await t.mutation(api.mora.executeApprovedMoraAction, {
      actionId: action!._id,
    });
    const reminders = await t.query(api.events.listReminderRules, { babyId });
    const settings = await t.query(api.mora.getMoraSettings, {});

    expect(settings.yoloMode).toBe(true);
    expect(result.status).toBe("executed");
    expect(reminders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "Feed check", category: "feed" }),
      ])
    );
  });
});

