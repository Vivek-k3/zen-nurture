import webpush from "web-push";
import { sendWithRetry, logDeliveries, type DeliveryOutcome } from "@/lib/push";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;
const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL!;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(`mailto:noreply@zennurture.app`, VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, title, body: notifBody, url, tag } = body;

    if (!userId) {
      return Response.json({ error: "userId required" }, { status: 400 });
    }

    const res = await fetch(`${CONVEX_SITE_URL}/api/push/cron-subs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CRON_SECRET}`,
      },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      return Response.json({ error: "Failed to fetch subscriptions" }, { status: 502 });
    }

    const subscriptions = await res.json();

    if (subscriptions.length === 0) {
      return Response.json({ sent: 0, reason: "no subscriptions" });
    }

    const payload = JSON.stringify({
      title: title || "Zen Nurture",
      body: notifBody || "You have a notification",
      url: url || "/",
      tag: tag || "zen-nurture",
    });

    const deliveries: DeliveryOutcome[] = [];

    for (const sub of subscriptions) {
      const outcome = await sendWithRetry({ endpoint: sub.endpoint, keys: sub.keys, userId }, payload);
      outcome.title = title || "Zen Nurture";
      deliveries.push(outcome);

      if (outcome.status === "expired") {
        await fetch(`${CONVEX_SITE_URL}/api/push/cron-unsubscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${CRON_SECRET}`,
          },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
    }

    await logDeliveries(CONVEX_SITE_URL, CRON_SECRET, deliveries);

    const sent = deliveries.filter((d) => d.status === "sent").length;
    const failed = deliveries.length - sent;
    return Response.json({ sent, failed });
  } catch (err: unknown) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
