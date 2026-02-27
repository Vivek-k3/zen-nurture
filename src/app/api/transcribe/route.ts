import OpenAI from "openai";

const client = new OpenAI();

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });
  }

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
