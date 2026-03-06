import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../convex/_generated/api";
import {
  createEventForBaby,
  createFamilyAndBaby,
  makeConvexTest,
  setConvexUser,
} from "../helpers/convex";

describe("Convex nudges and digests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-07T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("surfaces overdue feed nudges from historical cadence", async () => {
    const t = makeConvexTest();
    setConvexUser({ _id: "user-1", email: "owner@example.com", name: "Owner" });
    const { babyId } = await createFamilyAndBaby(t);

    await createEventForBaby(t, {
      babyId,
      type: "FEED_BOTTLE",
      timestamp: "2026-03-07T02:00:00.000Z",
      payload: { amountMl: 120 },
    });
    await createEventForBaby(t, {
      babyId,
      type: "FEED_BREAST",
      timestamp: "2026-03-07T04:00:00.000Z",
      payload: { durationMin: 15, side: "left" },
    });
    await createEventForBaby(t, {
      babyId,
      type: "FEED_BOTTLE",
      timestamp: "2026-03-07T06:00:00.000Z",
      payload: { amountMl: 110 },
    });

    const nudges = await t.query(api.nudges.getActiveNudges, {
      babyId,
      now: "2026-03-07T12:00:00.000Z",
    });

    expect(nudges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "FEED_BOTTLE",
          severity: "alert",
        }),
      ])
    );
  });

  it("computes weekly comparisons and stores the latest digest", async () => {
    const t = makeConvexTest();
    setConvexUser({ _id: "user-1", email: "owner@example.com", name: "Owner" });
    const { babyId } = await createFamilyAndBaby(t);

    await createEventForBaby(t, {
      babyId,
      type: "FEED_BOTTLE",
      timestamp: "2026-03-03T08:00:00.000Z",
      payload: { amountMl: 120 },
    });
    await createEventForBaby(t, {
      babyId,
      type: "DIAPER",
      timestamp: "2026-03-04T09:00:00.000Z",
      payload: { kind: "wet" },
    });
    await createEventForBaby(t, {
      babyId,
      type: "SLEEP",
      timestamp: "2026-03-05T07:00:00.000Z",
      payload: {
        startTs: "2026-03-05T05:30:00.000Z",
        endTs: "2026-03-05T07:00:00.000Z",
      },
    });
    await createEventForBaby(t, {
      babyId,
      type: "FEED_BOTTLE",
      timestamp: "2026-02-25T08:00:00.000Z",
      payload: { amountMl: 90 },
    });

    const comparison = await t.query(api.digest.getWeeklyComparison, { babyId });
    const digestId = await t.mutation(api.digest.saveDigest, {
      babyId,
      weekStart: comparison!.thisWeek.from,
      weekEnd: comparison!.thisWeek.to,
      thisWeek: comparison!.thisWeek,
      lastWeek: comparison!.lastWeek,
      summary: "Feeds and sleep improved this week.",
    });
    const latest = await t.query(api.digest.getLatestDigest, { babyId });

    expect(comparison?.thisWeek.feeds.count).toBeGreaterThan(0);
    expect(comparison?.lastWeek.feeds.count).toBeGreaterThan(0);
    expect(latest).toMatchObject({
      _id: digestId,
      summary: "Feeds and sleep improved this week.",
    });
  });
});

