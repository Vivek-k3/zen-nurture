import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { getToken } from "@/lib/auth";

/**
 * Create a ConvexHttpClient using the NEXT_PUBLIC_CONVEX_URL environment variable and attach optional authentication.
 *
 * @param token - Optional authentication token to set on the client
 * @returns The configured ConvexHttpClient instance
 * @throws Error if NEXT_PUBLIC_CONVEX_URL is not configured
 */
function getConvex(token?: string) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  const client = new ConvexHttpClient(url);
  if (token) client.setAuth(token);
  return client;
}

/**
 * Creates a push subscription for the authenticated user from the request body.
 *
 * @param req - Incoming request whose JSON body must contain `endpoint` and `keys` (`p256dh` and `auth`)
 * @returns A JSON `Response`:
 * - `{ ok: true }` on success
 * - `{ error: "Unauthenticated" }` with status `401` if no auth token is available
 * - `{ error: "Invalid subscription" }` with status `400` if `endpoint` or required `keys` are missing
 * - `{ error: "<message>" }` with status `500` for other server errors
 */
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

/**
 * Removes a push subscription specified in the request body and returns an HTTP response.
 *
 * @returns An HTTP Response: `200` with JSON `{ ok: true }` on success; `401` with JSON `{ error: "Unauthenticated" }` if the requester is not authenticated; `500` with JSON `{ error: <message> }` on server error.
 */
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
