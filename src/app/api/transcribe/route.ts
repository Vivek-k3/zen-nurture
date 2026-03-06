import OpenAI from "openai";
import { getToken } from "@/lib/auth";

const client = new OpenAI();
const TRANSCRIBE_MODEL = "whisper-1";

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });
  }

  const token = await getToken();
  if (!token) {
    return Response.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return Response.json({ error: "No audio file" }, { status: 400 });
    }

    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: TRANSCRIBE_MODEL,
      language: "en",
      prompt: "Baby care tracking: bottle feed, breast feed, diaper, sleep, medicine, Similac, Enfamil, Nan, Aptamil, Calpol, paracetamol, vitamin D, iron drops",
    });

    return Response.json({ text: transcription.text });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
