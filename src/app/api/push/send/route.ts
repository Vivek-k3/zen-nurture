import webpush from "web-push";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;
const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL!;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(`mailto:noreply@zennurture.app`, VAPID_PUBLIC, VAPID_PRIVATE);
}

/**
 * Handles an authenticated cron-triggered push notification dispatch for a user's subscriptions.
 *
 * Expects the request to include an Authorization header equal to `Bearer <CRON_SECRET>` and a JSON body containing `userId` (required) and optional `title`, `body`, `url`, and `tag`.
 *
 * @param req - The incoming HTTP request with the Authorization header and JSON payload:
 *   - `userId` (required) — identifier of the user whose subscriptions will receive the notification
 *   - `title` (optional) — notification title; defaults to "Zen Nurture"
 *   - `body` (optional) — notification body; defaults to "You have a notification"
 *   - `url` (optional) — target URL for the notification; defaults to "/"
 *   - `tag` (optional) — notification tag; defaults to "zen-nurture"
 * @returns A JSON response:
 *   - `{ sent: number, failed: number }` on successful dispatch with counts of deliveries
 *   - `{ sent: 0, reason: "no subscriptions" }` if the user has no subscriptions
 *   - `{ error: "userId required" }` with status 400 when `userId` is missing
 *   - `{ error: "Unauthorized" }` with status 401 when the Authorization header is invalid or missing
 *   - `{ error: "Failed to fetch subscriptions" }` with status 502 when subscription retrieval fails
 *   - `{ error: string }` with status 500 for unexpected server errors
 */
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

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
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
    }

    return Response.json({ sent, failed });
  } catch (err: unknown) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
