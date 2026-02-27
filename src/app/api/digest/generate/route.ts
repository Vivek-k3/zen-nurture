import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { getToken } from "@/lib/auth";

function getConvex(token?: string) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  const client = new ConvexHttpClient(url);
  if (token) client.setAuth(token);
  return client;
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });
  }

  const token = await getToken();
  if (!token) {
    return Response.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { babyId } = await req.json();
  if (!babyId) {
    return Response.json({ error: "babyId required" }, { status: 400 });
  }

  const convex = getConvex(token);
  const profile = await convex.query(api.events.getBabyProfile, { id: babyId });
  const comparison = await convex.query(api.digest.getWeeklyComparison, { babyId });

  if (!comparison) {
    return Response.json({ error: "Could not compute comparison" }, { status: 500 });
  }

  const { thisWeek, lastWeek } = comparison;

  const prompt = [
    `You are Mora, the AI copilot in Zen Nurture, a baby care tracker.`,
    `Generate a warm, concise weekly digest for ${profile?.name || "baby"}.`,
    ``,
    `## This Week (${thisWeek.from} to ${thisWeek.to})`,
    `- Feeds: ${thisWeek.feeds.count} (${thisWeek.feeds.totalMl}ml total, ${thisWeek.feeds.perDay}/day)`,
    `- Diapers: ${thisWeek.diapers.count} (${thisWeek.diapers.perDay}/day, ${thisWeek.diapers.wet} wet, ${thisWeek.diapers.dirty} dirty)`,
    `- Sleep: ${thisWeek.sleep.totalHours}h total (${thisWeek.sleep.avgPerDay}h/day, ${thisWeek.sleep.sessions} sessions)`,
    `- Meds: ${thisWeek.meds.taken} taken, ${thisWeek.meds.skipped} skipped (${thisWeek.meds.adherence}% adherence)`,
    `- Growth entries: ${thisWeek.growth}, Notes: ${thisWeek.notes}`,
    ``,
    `## Last Week (${lastWeek.from} to ${lastWeek.to})`,
    `- Feeds: ${lastWeek.feeds.count} (${lastWeek.feeds.totalMl}ml total, ${lastWeek.feeds.perDay}/day)`,
    `- Diapers: ${lastWeek.diapers.count} (${lastWeek.diapers.perDay}/day)`,
    `- Sleep: ${lastWeek.sleep.totalHours}h total (${lastWeek.sleep.avgPerDay}h/day)`,
    `- Meds: ${lastWeek.meds.taken} taken, ${lastWeek.meds.skipped} skipped`,
    ``,
    `Instructions:`,
    `- Compare this week vs last week. Highlight improvements and concerns.`,
    `- Use simple language a tired parent can skim at 3 AM.`,
    `- Include a "Highlights" section, a "Watch" section for concerns, and a "Tip" with one actionable suggestion.`,
    `- Use emojis sparingly. Keep under 250 words.`,
    `- Format in markdown.`,
  ].join("\n");

  try {
    const result = await generateText({
      model: openai(process.env.MORA_MODEL || "gpt-4.1-nano"),
      prompt,
    });

    const summary = result.text;

    await convex.mutation(api.digest.saveDigest, {
      babyId,
      weekStart: thisWeek.from,
      weekEnd: thisWeek.to,
      thisWeek,
      lastWeek,
      summary,
    });

    return Response.json({ summary, thisWeek, lastWeek });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
