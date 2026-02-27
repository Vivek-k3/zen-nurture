import webpush from "web-push";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;
const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL!;
const FETCH_TIMEOUT_MS = 8000;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(`mailto:noreply@zennurture.app`, VAPID_PUBLIC, VAPID_PRIVATE);
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

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

    const res = await fetchWithTimeout(`${CONVEX_SITE_URL}/api/push/cron-subs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CRON_SECRET}`,
      },
      body: JSON.stringify({ babyId, familyId }),
    }, FETCH_TIMEOUT_MS);

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
            await fetchWithTimeout(`${CONVEX_SITE_URL}/api/push/cron-unsubscribe`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${CRON_SECRET}`,
              },
              body: JSON.stringify({ endpoint: sub.endpoint }),
            }, FETCH_TIMEOUT_MS);
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
