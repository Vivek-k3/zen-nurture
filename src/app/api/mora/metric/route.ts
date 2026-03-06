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
  try {
    const token = await getToken();
    if (!token) {
      return Response.json({ ok: false }, { status: 401 });
    }

    const body = await req.json();
    const convex = getConvex(token);

    try {
      await convex.mutation((api as any).mora.trackMoraMetric, body);
    } catch {
      // Metrics are best-effort only.
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true });
  }
}
