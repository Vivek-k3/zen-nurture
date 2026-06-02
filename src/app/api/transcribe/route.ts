import OpenAI from "openai";

export async function POST(req: Request) {
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
