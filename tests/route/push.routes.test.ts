import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("push routes", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL = "https://example.site";
    process.env.CRON_SECRET = "secret";
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "public";
    process.env.VAPID_PRIVATE_KEY = "private";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects unauthenticated subscribe requests", async () => {
    vi.doMock("@/lib/auth", () => ({
      getToken: vi.fn(async () => null),
    }));
    vi.doMock("convex/browser", () => ({
      ConvexHttpClient: class {
        setAuth() {}
        mutation = vi.fn();
      },
    }));

    const { POST } = await import("@/app/api/push/subscribe/route");
    const response = await POST(
      new Request("http://localhost/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify({ endpoint: "https://push.example", keys: { p256dh: "p", auth: "a" } }),
      })
    );

    expect(response.status).toBe(401);
  });

  it("validates subscription payloads and delete requests", async () => {
    vi.doMock("@/lib/auth", () => ({
      getToken: vi.fn(async () => "token"),
    }));
    vi.doMock("convex/browser", () => ({
      ConvexHttpClient: class {
        setAuth() {}
        mutation = vi.fn(async () => ({}));
      },
    }));

    const route = await import("@/app/api/push/subscribe/route");
    const invalidPost = await route.POST(
      new Request("http://localhost/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify({ endpoint: "", keys: {} }),
      })
    );
    const invalidDelete = await route.DELETE(
      new Request("http://localhost/api/push/subscribe", {
        method: "DELETE",
        body: JSON.stringify({}),
      })
    );

    expect(invalidPost.status).toBe(400);
    expect(invalidDelete.status).toBe(400);
  });

  it("rejects unauthorized send requests and validates missing user ids", async () => {
    const sendNotification = vi.fn();

    vi.doMock("web-push", () => ({
      default: {
        setVapidDetails: vi.fn(),
        sendNotification,
      },
    }));

    const { POST } = await import("@/app/api/push/send/route");
    const unauthorized = await POST(
      new Request("http://localhost/api/push/send", { method: "POST", body: JSON.stringify({}) })
    );
    const missingUserId = await POST(
      new Request("http://localhost/api/push/send", {
        method: "POST",
        headers: { Authorization: "Bearer secret" },
        body: JSON.stringify({ title: "Hello" }),
      })
    );

    expect(unauthorized.status).toBe(401);
    expect(missingUserId.status).toBe(400);
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("validates missing reminder identifiers for check-reminders", async () => {
    vi.doMock("web-push", () => ({
      default: {
        setVapidDetails: vi.fn(),
        sendNotification: vi.fn(),
      },
    }));

    const { POST } = await import("@/app/api/push/check-reminders/route");
    const response = await POST(
      new Request("http://localhost/api/push/check-reminders", {
        method: "POST",
        headers: { Authorization: "Bearer secret" },
        body: JSON.stringify({ babyId: "baby-1" }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "babyId and familyId required" });
  });
});

