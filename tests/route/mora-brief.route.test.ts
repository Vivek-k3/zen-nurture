import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("/api/mora/brief", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an empty-state brief when no baby exists", async () => {
    class MockConvexHttpClient {
      setAuth() {}
      async query() {
        return null;
      }
    }

    vi.doMock("@/lib/auth", () => ({
      getToken: vi.fn(async () => "token"),
    }));
    vi.doMock("convex/browser", () => ({
      ConvexHttpClient: MockConvexHttpClient,
    }));

    const { POST } = await import("@/app/api/mora/brief/route");
    const response = await POST(
      new Request("http://localhost/api/mora/brief", {
        method: "POST",
        body: JSON.stringify({ pageLabel: "Today" }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      pageLabel: "Today",
      babyId: null,
      headline: "Mora is ready",
      statusTone: "calm",
    });
  });

  it("returns a populated brief for a configured baby", async () => {
    const queryMock = vi.fn()
      .mockResolvedValueOnce({
        _id: "baby-1",
        name: "Aarav",
        dob: "2025-10-01",
        timezone: "Asia/Kolkata",
      })
      .mockResolvedValueOnce({
        FEED_BOTTLE: {
          timestamp: "2026-03-07T08:00:00.000Z",
          type: "FEED_BOTTLE",
          payload: { amountMl: 120, formulaName: "Nan Pro" },
        },
        DIAPER: null,
        SLEEP: null,
        MED_DOSE: null,
      })
      .mockResolvedValueOnce({
        feeds: { count: 4 },
        diapers: { total: 2 },
        sleeps: { totalMinutes: 180 },
      })
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    class MockConvexHttpClient {
      setAuth() {}
      query = queryMock;
    }

    vi.doMock("@/lib/auth", () => ({
      getToken: vi.fn(async () => "token"),
    }));
    vi.doMock("convex/browser", () => ({
      ConvexHttpClient: MockConvexHttpClient,
    }));

    const { POST } = await import("@/app/api/mora/brief/route");
    const response = await POST(
      new Request("http://localhost/api/mora/brief", {
        method: "POST",
        body: JSON.stringify({ babyId: "baby-1", pageLabel: "Today" }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      pageLabel: "Today",
      babyId: "baby-1",
      suggestions: expect.arrayContaining(["Summarize the last 24h"]),
      chips: expect.arrayContaining([
        expect.objectContaining({ label: "Last feed" }),
      ]),
    });
    expect(queryMock).toHaveBeenCalledTimes(5);
  });
});

