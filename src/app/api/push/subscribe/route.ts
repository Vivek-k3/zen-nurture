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
      return Response.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return Response.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const convex = getConvex(token);
    await convex.mutation(api.push.subscribe, { endpoint, keys });
    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const token = await getToken();
    if (!token) {
      return Response.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json();
    const convex = getConvex(token);
    await convex.mutation(api.push.unsubscribe, { endpoint: body.endpoint });
    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
