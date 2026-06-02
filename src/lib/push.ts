import webpush from "web-push";

export type PushSubscriptionRow = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userId?: string;
};

export type DeliveryOutcome = {
  endpoint: string;
  userId?: string;
  status: "sent" | "failed" | "expired";
  attempts: number;
  title?: string;
  error?: string;
};

// Transient = worth retrying (network/timeout/429/5xx). 404/410 = gone (handled
// separately as "expired"); other 4xx = permanent client error (don't retry).
function isTransient(statusCode?: number) {
  return statusCode === undefined || statusCode === 429 || (statusCode >= 500 && statusCode < 600);
}

/**
 * Send one web-push notification, retrying transient failures with backoff.
 * 404/410 → "expired" (caller should unsubscribe). Never throws.
 */
export async function sendWithRetry(
  subscription: PushSubscriptionRow,
  payload: string,
  maxAttempts = 3
): Promise<DeliveryOutcome> {
  let lastError: string | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: subscription.keys },
        payload
      );
      return { endpoint: subscription.endpoint, userId: subscription.userId, status: "sent", attempts: attempt };
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      lastError = err instanceof Error ? err.message : String(err);
      if (statusCode === 404 || statusCode === 410) {
        return { endpoint: subscription.endpoint, userId: subscription.userId, status: "expired", attempts: attempt, error: lastError };
      }
      if (!isTransient(statusCode) || attempt === maxAttempts) {
        return { endpoint: subscription.endpoint, userId: subscription.userId, status: "failed", attempts: attempt, error: lastError };
      }
      await new Promise((r) => setTimeout(r, 200 * attempt)); // linear backoff
    }
  }
  return { endpoint: subscription.endpoint, userId: subscription.userId, status: "failed", attempts: maxAttempts, error: lastError };
}

/** Best-effort: persist delivery outcomes to Convex. Never throws / blocks sending. */
export async function logDeliveries(
  convexSiteUrl: string,
  cronSecret: string,
  deliveries: DeliveryOutcome[]
): Promise<void> {
  if (deliveries.length === 0) return;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${convexSiteUrl}/api/push/cron-log-deliveries`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cronSecret}` },
      body: JSON.stringify({ deliveries }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Failed to log deliveries: ${res.status}`);
  } catch {
    // Logging is best-effort; a failure here (timeout, non-2xx, network) must
    // not affect notification delivery.
  } finally {
    clearTimeout(timeoutId);
  }
}
