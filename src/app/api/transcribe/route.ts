import OpenAI from "openai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { getToken } from "@/lib/auth";

function getConvex(token?: string) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  const client = new ConvexHttpClient(url);
  if (token) client.setAuth(token);
  return client;
}

export async function POST(req: Request) {
  // Require an authenticated session first — this route calls a paid API
  // (Whisper). Auth is checked before any config so unauthenticated callers
  // can't probe server state.
  const token = await getToken();
  if (!token) {
    return Response.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });
  }

  // Per-user rate limit (shared cap with the digest route). Fail closed: a
  // missing Convex URL must not let callers reach the paid Whisper call
  // unthrottled. Only a real limiter hit maps to 429; other errors → 500.
  let convex: ConvexHttpClient;
  try {
    convex = getConvex(token);
  } catch (err: any) {
    return Response.json(
      { error: err?.message || "Server misconfigured" },
      { status: 500 }
    );
  }

  let limited = false;
  try {
    ({ limited } = await convex.mutation(api.aiHttp.checkAiHttpLimit, {}));
  } catch (err: any) {
    return Response.json(
      { error: err?.message || "Rate limit check failed" },
      { status: 500 }
    );
  }
  if (limited) {
    return Response.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  // Created lazily (not at module scope) so importing the route during build
  // doesn't throw when OPENAI_API_KEY is absent.
  const client = new OpenAI();

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return Response.json({ error: "No audio file" }, { status: 400 });
    }

    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en",
      prompt: "Baby care tracking: bottle feed, breast feed, diaper, sleep, medicine, Similac, Enfamil, Nan, Aptamil, Calpol, paracetamol, vitamin D, iron drops",
    });

    return Response.json({ text: transcription.text });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
