import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("/api/mora", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.OPENAI_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when no auth token is available", async () => {
    vi.doMock("@/lib/auth", () => ({
      getToken: vi.fn(async () => null),
    }));
    vi.doMock("@ai-sdk/openai", () => ({ openai: vi.fn() }));
    vi.doMock("ai", () => ({
      convertToModelMessages: vi.fn(async (messages) => messages),
      stepCountIs: vi.fn(),
      streamText: vi.fn(() => ({
        toUIMessageStreamResponse: () => new Response("ok"),
      })),
      tool: (config: unknown) => config,
    }));
    vi.doMock("convex/browser", () => ({
      ConvexHttpClient: class {
        setAuth() {}
      },
    }));

    const { POST } = await import("@/app/api/mora/route");
    const response = await POST(
      new Request("http://localhost/api/mora", {
        method: "POST",
        body: JSON.stringify({ messages: [] }),
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthenticated" });
  });

  it("falls back to the authorized baby when clientContext carries a stale baby id", async () => {
    const queryMock = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        _id: "baby-1",
        name: "Aarav",
        dob: "2025-10-01",
        timezone: "Asia/Kolkata",
      })
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({
        enabled: true,
        yoloMode: false,
        allowWrites: true,
        allowedWriteScopes: ["events", "reminders", "notes"],
      });
    const mutationMock = vi.fn();

    vi.doMock("@/lib/auth", () => ({
      getToken: vi.fn(async () => "token"),
    }));
    vi.doMock("@ai-sdk/openai", () => ({ openai: vi.fn(() => "model") }));
    vi.doMock("ai", () => ({
      convertToModelMessages: vi.fn(async (messages) => messages),
      stepCountIs: vi.fn(),
      streamText: vi.fn(() => ({
        toUIMessageStreamResponse: () => new Response("ok"),
      })),
      tool: (config: unknown) => config,
    }));
    vi.doMock("convex/browser", () => ({
      ConvexHttpClient: class {
        setAuth() {}
        query = queryMock;
        mutation = mutationMock;
      },
    }));

    const { POST } = await import("@/app/api/mora/route");
    const response = await POST(
      new Request("http://localhost/api/mora", {
        method: "POST",
        body: JSON.stringify({
          messages: [],
          clientContext: { babyId: "stale-baby-id", pageLabel: "Today" },
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(queryMock.mock.calls[0]?.[1]).toEqual({ id: "stale-baby-id" });
    expect(queryMock.mock.calls[1]?.[1]).toEqual({});
  });

  it("blocks invalid Mora event writes before creating an action", async () => {
    let createEventResult: unknown;
    const queryMock = vi.fn()
      .mockResolvedValueOnce({
        _id: "baby-1",
        name: "Aarav",
        dob: "2025-10-01",
        timezone: "Asia/Kolkata",
      })
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({
        enabled: true,
        yoloMode: false,
        allowWrites: true,
        allowedWriteScopes: ["events", "reminders", "notes"],
      })
      .mockResolvedValueOnce({
        enabled: true,
        yoloMode: false,
        allowWrites: true,
        allowedWriteScopes: ["events", "reminders", "notes"],
      });
    const mutationMock = vi.fn();

    vi.doMock("@/lib/auth", () => ({
      getToken: vi.fn(async () => "token"),
    }));
    vi.doMock("@ai-sdk/openai", () => ({ openai: vi.fn(() => "model") }));
    vi.doMock("ai", () => ({
      convertToModelMessages: vi.fn(async (messages) => messages),
      stepCountIs: vi.fn(),
      streamText: vi.fn((config: any) => ({
        toUIMessageStreamResponse: async () => {
          createEventResult = await config.tools.create_event.execute({
            type: "GROWTH",
            payload: {},
          });

          return new Response(JSON.stringify({ createEventResult }), {
            headers: { "content-type": "application/json" },
          });
        },
      })),
      tool: (config: unknown) => config,
    }));
    vi.doMock("convex/browser", () => ({
      ConvexHttpClient: class {
        setAuth() {}
        query = queryMock;
        mutation = mutationMock;
      },
    }));

    const { POST } = await import("@/app/api/mora/route");
    const response = await POST(
      new Request("http://localhost/api/mora", {
        method: "POST",
        body: JSON.stringify({
          threadId: "thread-1",
          messages: [{ role: "user", parts: [{ type: "text", text: "Add a weight entry" }] }],
          clientContext: { babyId: "baby-1", pageLabel: "Today" },
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(createEventResult).toEqual({
      status: "blocked",
      reason: "Growth events require at least one measurement: weightKg, heightCm, or headCm.",
    });
    expect(mutationMock).not.toHaveBeenCalled();
  });
});
