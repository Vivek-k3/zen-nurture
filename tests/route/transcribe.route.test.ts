import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("/api/transcribe", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.OPENAI_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    vi.doMock("@/lib/auth", () => ({
      getToken: vi.fn(async () => null),
    }));
    vi.doMock("openai", () => ({
      default: class OpenAI {
        audio = { transcriptions: { create: vi.fn() } };
      },
    }));

    const { POST } = await import("@/app/api/transcribe/route");
    const response = await POST(new Request("http://localhost/api/transcribe", { method: "POST" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthenticated" });
  });

  it("rejects requests without an audio file", async () => {
    vi.doMock("@/lib/auth", () => ({
      getToken: vi.fn(async () => "token"),
    }));
    vi.doMock("openai", () => ({
      default: class OpenAI {
        audio = { transcriptions: { create: vi.fn() } };
      },
    }));

    const { POST } = await import("@/app/api/transcribe/route");
    const formData = new FormData();
    const response = await POST(
      new Request("http://localhost/api/transcribe", {
        method: "POST",
        body: formData,
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "No audio file" });
  });

  it("transcribes audio with Whisper", async () => {
    const createMock = vi.fn(async () => ({ text: "logged 120ml formula" }));

    vi.doMock("@/lib/auth", () => ({
      getToken: vi.fn(async () => "token"),
    }));
    vi.doMock("openai", () => ({
      default: class OpenAI {
        audio = { transcriptions: { create: createMock } };
      },
    }));

    const { POST } = await import("@/app/api/transcribe/route");
    const formData = new FormData();
    formData.append("audio", new File(["audio"], "voice.webm", { type: "audio/webm" }));

    const response = await POST(
      new Request("http://localhost/api/transcribe", {
        method: "POST",
        body: formData,
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ text: "logged 120ml formula" });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "whisper-1",
        language: "en",
      })
    );
  });
});

