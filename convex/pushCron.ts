import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

export const getSubsForCron = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = request.headers.get("Authorization");
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { userId?: string; familyId?: Id<"families">; babyId?: Id<"babyProfiles"> };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (body.userId) {
    const subs = await ctx.runQuery(internal.push.listSubscriptionsByUser, {
      userId: body.userId,
    });
    return new Response(JSON.stringify(subs), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (body.familyId && body.babyId) {
    const baby = await ctx.runQuery(internal.events.internalGetBabyProfileById, {
      babyId: body.babyId,
    });
    if (!baby || baby.familyId !== body.familyId) {
      return new Response(
        JSON.stringify({ error: "babyId does not belong to familyId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const [subs, upcoming] = await Promise.all([
      ctx.runQuery(internal.push.listSubscriptionsForFamily, {
        familyId: body.familyId,
      }),
      ctx.runQuery(internal.events.internalComputeUpcomingReminders, {
        babyId: body.babyId,
      }),
    ]);
    return new Response(
      JSON.stringify({ subscriptions: subs, upcoming }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  if (body.familyId) {
    const subs = await ctx.runQuery(internal.push.listSubscriptionsForFamily, {
      familyId: body.familyId,
    });
    return new Response(JSON.stringify(subs), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ error: "userId or familyId required" }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
});

export const unsubscribeStaleEndpoint = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = request.headers.get("Authorization");
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { endpoint: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.endpoint) {
    return new Response(
      JSON.stringify({ error: "endpoint required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  await ctx.runMutation(internal.push.unsubscribeByEndpoint, {
    endpoint: body.endpoint,
  });
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

/** Batch-record push delivery outcomes from the send routes (CRON_SECRET auth). */
export const logDeliveries = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = request.headers.get("Authorization");
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: {
    deliveries?: Array<{
      endpoint: string;
      userId?: string;
      status: string;
      attempts: number;
      title?: string;
      error?: string;
    }>;
  };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const deliveries = body.deliveries ?? [];
  if (deliveries.length > 0) {
    await ctx.runMutation(internal.push.recordDeliveries, { deliveries });
  }
  return new Response(JSON.stringify({ logged: deliveries.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
