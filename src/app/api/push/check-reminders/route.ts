import webpush from "web-push";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;
const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL!;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(`mailto:noreply@zennurture.app`, VAPID_PUBLIC, VAPID_PRIVATE);
}

/**
 * Handle a cron-triggered POST to fetch due reminders and send web push notifications to subscriptions.
 *
 * Validates a Bearer token from the Authorization header, expects a JSON body containing `babyId` and `familyId`,
 * fetches subscriptions and upcoming reminders from the configured Convex site, selects overdue or imminently due reminders,
 * sends notifications to each subscription, and removes subscriptions that return 404/410.
 *
 * @param req - The incoming Request whose JSON body must include `babyId` and `familyId`
 * @returns A Response whose JSON body is `{ sent: number, reminders: number }` when notifications were processed,
 * or an error object such as `{ error: string, reason?: string }` with an appropriate HTTP status code (e.g. 401, 400, 502, 500)
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { babyId, familyId } = body;

    if (!babyId || !familyId) {
      return Response.json({ error: "babyId and familyId required" }, { status: 400 });
    }

    const res = await fetch(`${CONVEX_SITE_URL}/api/push/cron-subs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CRON_SECRET}`,
      },
      body: JSON.stringify({ babyId, familyId }),
    });

    if (!res.ok) {
      return Response.json({ error: "Failed to fetch reminder data" }, { status: 502 });
    }

    const { subscriptions, upcoming } = await res.json();

    const overdueReminders = upcoming.filter((r: { isOverdue: boolean }) => r.isOverdue);
    const soonReminders = upcoming.filter((r: { isOverdue: boolean; dueTime: string }) => {
      if (r.isOverdue) return false;
      const dueMs = new Date(r.dueTime).getTime();
      const nowMs = Date.now();
      return dueMs - nowMs < 5 * 60 * 1000;
    });

    const toNotify = [...overdueReminders, ...soonReminders];
    if (toNotify.length === 0) {
      return Response.json({ sent: 0, reason: "no due reminders" });
    }

    if (subscriptions.length === 0) {
      return Response.json({ sent: 0, reason: "no subscriptions" });
    }

    let sent = 0;
    for (const reminder of toNotify) {
      const payload = JSON.stringify({
        title: reminder.isOverdue ? `Overdue: ${reminder.rule.title}` : reminder.rule.title,
        body: reminder.isOverdue
          ? `This reminder is overdue. Tap to log.`
          : `Due now. Tap to log.`,
        url: "/reminders",
        tag: `reminder-${reminder.rule._id}`,
      });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            payload
          );
          sent++;
        } catch (err: unknown) {
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
    }

    return Response.json({ sent, reminders: toNotify.length });
  } catch (err: unknown) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
