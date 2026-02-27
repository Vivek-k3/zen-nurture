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
    const { babyId, familyId } = body;

    if (!babyId || !familyId) {
      return Response.json({ error: "babyId and familyId required" }, { status: 400 });
    }

    const upcoming = await convex.query(api.events.computeUpcomingReminders, {
      babyId,
    } as any);

    const overdueReminders = upcoming.filter((r: any) => r.isOverdue);
    const soonReminders = upcoming.filter((r: any) => {
      if (r.isOverdue) return false;
      const dueMs = new Date(r.dueTime).getTime();
      const nowMs = Date.now();
      return dueMs - nowMs < 5 * 60 * 1000; // due within 5 minutes
    });

    const toNotify = [...overdueReminders, ...soonReminders];
    if (toNotify.length === 0) {
      return Response.json({ sent: 0, reason: "no due reminders" });
    }

    const subscriptions = await convex.query(api.push.listAllForFamily, { familyId });
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
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await convex.mutation(api.push.unsubscribe, { endpoint: sub.endpoint });
          }
        }
      }
    }

    return Response.json({ sent, reminders: toNotify.length });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
