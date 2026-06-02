import OpenAI from "openai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { getToken } from "@/lib/auth";

export async function POST(req: Request) {
  // Require an authenticated session first — this route calls a paid API
  // (Whisper). Auth is checked before any config so unauthenticated callers
  // can't probe server state.
  const token = await getToken();
  if (!token) {
    return Response.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Per-user rate limit (shared cap with the digest route).
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (convexUrl) {
    const convex = new ConvexHttpClient(convexUrl);
    convex.setAuth(token);
    try {
      await convex.mutation(api.aiHttp.checkAiHttpLimit, {});
    } catch {
      return Response.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });
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
