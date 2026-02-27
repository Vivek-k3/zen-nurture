import webpush from "web-push";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(`mailto:noreply@zennurture.app`, VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, title, body: notifBody, url, tag } = body;

    if (!userId) {
      return Response.json({ error: "userId required" }, { status: 400 });
    }

    const subscriptions = await convex.query(api.push.listByUser, { userId });

    if (subscriptions.length === 0) {
      return Response.json({ sent: 0, reason: "no subscriptions" });
    }

    const payload = JSON.stringify({
      title: title || "Zen Nurture",
      body: notifBody || "You have a notification",
      url: url || "/",
      tag: tag || "zen-nurture",
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        );
        sent++;
      } catch (err: any) {
        failed++;
        if (err.statusCode === 404 || err.statusCode === 410) {
          await convex.mutation(api.push.unsubscribe, { endpoint: sub.endpoint });
        }
      }
    }

    return Response.json({ sent, failed });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
