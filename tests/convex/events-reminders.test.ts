import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import {
  createEventForBaby,
  createFamilyAndBaby,
  makeConvexTest,
  setConvexUser,
} from "../helpers/convex";

describe("Convex events and reminders", () => {
  it("creates, updates, lists, and reads timeline events with normalized payloads", async () => {
    const t = makeConvexTest();
    setConvexUser({ _id: "user-1", email: "owner@example.com", name: "Owner" });
    const { babyId } = await createFamilyAndBaby(t);

    const eventId = await createEventForBaby(t, {
      babyId,
      type: "bottle feed",
      timestamp: "2026-03-07T08:00:00.000Z",
      payload: { amount_ml: "120", formula_name: "Nan Pro", content_type: "Breast Milk" },
    });

    await t.mutation(api.events.updateEvent, {
      id: eventId,
      payload: { amountMl: 150, formulaName: "Nan Optipro", contentType: "formula" },
    });

    const event = await t.query(api.events.getEvent, { id: eventId });
    const events = await t.query(api.events.listEvents, { babyId, limit: 20 });
    const timeline = await t.query(api.events.listTimeline, { babyId, limit: 20 });

    expect(event).toMatchObject({
      _id: eventId,
      type: "FEED_BOTTLE",
      source: "manual",
      payload: {
        amountMl: 150,
        contentType: "formula",
        formulaName: "Nan Optipro",
      },
      loggedByName: "Owner",
    });
    expect(events).toHaveLength(1);
    expect(timeline[0]).toMatchObject({
      _id: eventId,
      type: "FEED_BOTTLE",
      payload: { amountMl: 150, formulaName: "Nan Optipro" },
    });
  });

  it("computes daily and range aggregates and enforces baby access", async () => {
    const t = makeConvexTest();
    setConvexUser({ _id: "user-1", email: "owner@example.com", name: "Owner" });
    const { babyId } = await createFamilyAndBaby(t);

    await createEventForBaby(t, {
      babyId,
      type: "FEED_BOTTLE",
      timestamp: "2026-03-07T08:00:00.000Z",
      payload: { amountMl: 120 },
    });
    await createEventForBaby(t, {
      babyId,
      type: "DIAPER",
      timestamp: "2026-03-07T09:00:00.000Z",
      payload: { kind: "mixed", blowout: true, color: "yellow" },
    });
    await createEventForBaby(t, {
      babyId,
      type: "SLEEP",
      timestamp: "2026-03-07T07:30:00.000Z",
      payload: {
        startTs: "2026-03-07T06:00:00.000Z",
        endTs: "2026-03-07T07:30:00.000Z",
      },
    });
    await createEventForBaby(t, {
      babyId,
      type: "MED_DOSE",
      timestamp: "2026-03-06T20:00:00.000Z",
      payload: { medicineName: "Calpol", outcome: "skipped" },
    });

    const daily = await t.query(api.events.getDailyAggregates, {
      babyId,
      date: "2026-03-07",
    });
    const range = await t.query(api.events.getRangeAggregates, {
      babyId,
      from: "2026-03-06T00:00:00.000Z",
      to: "2026-03-07T23:59:59.999Z",
    });

    expect(daily).toMatchObject({
      feeds: { count: 1, totalMl: 120 },
      diapers: { total: 1, blowoutCount: 1 },
      sleeps: { totalMinutes: 90, sessions: 1 },
    });
    expect(range["2026-03-06"]).toMatchObject({
      meds: { skipped: 1 },
    });
    expect(range["2026-03-07"]).toMatchObject({
      feeds: { count: 1, totalMl: 120 },
      diapers: { count: 1 },
      sleeps: { totalMin: 90, sessions: 1 },
    });

    setConvexUser({ _id: "user-2", email: "other@example.com", name: "Other" });
    await expect(
      t.query(api.events.listEvents, { babyId, limit: 20 })
    ).rejects.toThrow("Not authorized");
  });

  it("creates, updates, deletes, and computes upcoming reminders", async () => {
    const t = makeConvexTest();
    setConvexUser({ _id: "user-1", email: "owner@example.com", name: "Owner" });
    const { babyId } = await createFamilyAndBaby(t);

    await createEventForBaby(t, {
      babyId,
      type: "FEED_BOTTLE",
      timestamp: "2026-03-07T08:00:00.000Z",
      payload: { amountMl: 120 },
    });

    const intervalRuleId = await t.mutation(api.events.createReminderRule, {
      babyId,
      title: "Feed again",
      category: "feed",
      triggerType: "afterLastEventType",
      triggerConfig: { lastEventType: "FEED_BOTTLE", intervalHours: 3 },
      enabled: true,
    });
    const fixedRuleId = await t.mutation(api.events.createReminderRule, {
      babyId,
      title: "Morning medicine",
      category: "medicine",
      triggerType: "fixedTimes",
      triggerConfig: { times: ["09:00"] },
      enabled: true,
    });

    await t.mutation(api.events.updateReminderRule, {
      id: fixedRuleId,
      title: "Morning meds",
      enabled: false,
    });

    const rules = await t.query(api.events.listReminderRules, { babyId });
    const upcoming = await t.query(api.events.computeUpcomingReminders, {
      babyId,
      now: "2026-03-07T12:30:00.000Z",
    });

    expect(rules).toHaveLength(2);
    expect(rules.find((rule) => rule._id === fixedRuleId)).toMatchObject({
      title: "Morning meds",
      enabled: false,
    });
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0]).toMatchObject({
      rule: expect.objectContaining({ _id: intervalRuleId, title: "Feed again" }),
      isOverdue: true,
      dueTime: "2026-03-07T11:00:00.000Z",
    });

    await t.mutation(api.events.deleteReminderRule, { id: intervalRuleId });
    await expect(t.query(api.events.getReminderRule, { id: intervalRuleId })).resolves.toBeNull();
  });
});

