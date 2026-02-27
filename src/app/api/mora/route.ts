import { openai } from "@ai-sdk/openai";
import { ConvexHttpClient } from "convex/browser";
import {
  UIMessage,
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
} from "ai";
import { z } from "zod";
import { api } from "../../../../convex/_generated/api";

type MoraClientContext = {
  pathname?: string;
  pageLabel?: string;
  timestamp?: string;
  userName?: string;
  userEmail?: string;
  babyName?: string;
  babyDob?: string;
  babyTimezone?: string;
  familyName?: string;
};

function getConvex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(url);
}

function getLatestUserText(messages: UIMessage[]) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return "";
  return (lastUser.parts || [])
    .filter((p: any) => p.type === "text")
    .map((p: any) => p.text)
    .join("\n")
    .toLowerCase();
}

function hasExplicitDeleteIntent(text: string) {
  return /(^|\b)(delete|remove|erase)\b/.test(text);
}

function pageCapabilities(pageLabel?: string) {
  switch (pageLabel) {
    case "Today":
      return "Prioritize live status, the last 24h summary, and concrete next-step guidance.";
    case "Trends":
      return "Prioritize historical analysis and trends across days/weeks.";
    case "Reminders":
      return "Prioritize reminder review/creation/updates.";
    case "Records":
      return "Prioritize searching notes and historic events.";
    case "Settings":
      return "Prioritize explaining Mora settings, YOLO mode, and write safety.";
    default:
      return "Provide concise guidance and ask follow-up questions when context is missing.";
  }
}

async function queueOrExecuteWrite({
  convex,
  threadId,
  actionType,
  payload,
  preview,
  latestUserText,
}: {
  convex: ConvexHttpClient;
  threadId: string;
  actionType: string;
  payload: Record<string, unknown>;
  preview: string;
  latestUserText: string;
}) {
  if (!threadId) throw new Error("Missing threadId for Mora action logging");

  if (actionType.includes("delete") && !hasExplicitDeleteIntent(latestUserText)) {
    return {
      status: "blocked",
      reason: "Delete requests require explicit wording like 'delete' or 'remove' in your latest message.",
    };
  }

  const settings = await convex.query(api.mora.getMoraSettings, {});
  if (!settings.enabled) {
    return { status: "blocked", reason: "Mora is disabled in Settings." };
  }
  if (!settings.allowWrites) {
    return { status: "blocked", reason: "Mora writes are disabled in Settings." };
  }

  const scope = actionType.startsWith("event.")
    ? "events"
    : actionType.startsWith("reminder.")
    ? "reminders"
    : actionType === "note.create"
    ? "notes"
    : "unknown";

  if (!settings.allowedWriteScopes.includes(scope)) {
    return { status: "blocked", reason: `Write scope '${scope}' is not allowed.` };
  }

  const action = await convex.mutation(api.mora.createPendingMoraAction, {
    threadId: threadId as any,
    actionType,
    payload,
    preview,
    requiresApproval: !settings.yoloMode,
  });

  if (settings.yoloMode) {
    const result = await convex.mutation(api.mora.executeApprovedMoraAction, {
      actionId: action!._id as any,
    });
    return { status: "executed", actionId: action!._id, result };
  }

  return {
    status: "pending_approval",
    actionId: action!._id,
    preview,
    message: "I prepared a change and added an approval card in the Mora sidebar.",
  };
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY is not configured. Add it to use Mora AI chat." }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  const body = (await req.json()) as {
    messages: UIMessage[];
    threadId?: string;
    clientContext?: MoraClientContext;
  };

  const messages = body.messages ?? [];
  const threadId = body.threadId;
  const clientContext = body.clientContext ?? {};
  const convex = getConvex();
  const latestUserText = getLatestUserText(messages);

  const babyProfile = await convex.query(api.events.getBabyProfile, {});
  const babyId = babyProfile?._id;
  const recentEvents = babyId
    ? await convex.query(api.events.listEvents, {
        babyId,
        from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
        limit: 20,
      } as any)
    : [];
  const upcomingReminders = babyId
    ? await convex.query(api.events.computeUpcomingReminders, { babyId } as any)
    : [];
  const moraSettings = await convex.query(api.mora.getMoraSettings, {});

  const system = [
    "You are Mora, an AI caregiver copilot inside Zen Nurture — a calm, India-first baby care tracker.",
    "",
    "## Personality",
    "- Warm, concise, action-oriented. Use tools for factual answers instead of guessing.",
    "- Address the user by first name when known. Reference the baby by name.",
    "- When the user requests a data change, use the appropriate write tool — never describe manual steps.",
    "- In YOLO mode, actions execute immediately. In Safe mode, actions require human approval — tell the user you've queued it.",
    "",
    "## Smart Reminders",
    "- When the user asks about patterns, feeding schedules, or reminders, use analyze_patterns first.",
    "- If you detect a clear interval (e.g. baby feeds every ~2.5h), proactively suggest creating a reminder.",
    "- Phrase suggestions naturally: 'Baby usually feeds every 2.5 hours. Want me to set a reminder for that?'",
    "- If the user agrees, use create_reminder with the suggested triggerConfig from analyze_patterns.",
    "- Compare with existing reminders to avoid duplicates.",
    "",
    "## Proactive Nudges",
    "- When user asks 'anything I should know?', 'is everything OK?', or 'status check', use check_nudges.",
    "- If nudges exist, present them with empathy: 'Baby hasn't fed in 4h, which is longer than the usual 2.5h. Everything OK?'",
    "- Suggest logging the event if overdue, or reassure if the gap is within normal range.",
    "",
    "## Weekly Digest",
    "- When user asks for a weekly summary/report/digest, use generate_weekly_digest.",
    "- Present the comparison in a friendly, scannable format with highlights and concerns.",
    "",
    "## Boundaries",
    "- Never propose unsupported actions (clear all data, caregiver mutations, baby profile mutations).",
    "- Never fabricate data. If a tool returns empty, say so.",
    "",
    "## Current Context",
    `- User: ${clientContext.userName || "Unknown"} (${clientContext.userEmail || "unknown"})`,
    `- Family: ${clientContext.familyName || "Unknown"}`,
    `- Baby: ${clientContext.babyName || babyProfile?.name || "Unknown"}${clientContext.babyDob ? ` (DOB: ${clientContext.babyDob})` : ""}`,
    `- Timezone: ${clientContext.babyTimezone || babyProfile?.timezone || "Asia/Kolkata"}`,
    `- Page: ${clientContext.pageLabel ?? "Unknown"} (${clientContext.pathname ?? "/"})`,
    `- ${pageCapabilities(clientContext.pageLabel)}`,
    `- Mora settings: enabled=${moraSettings.enabled}, yoloMode=${moraSettings.yoloMode}, allowWrites=${moraSettings.allowWrites}`,
    `- Recent events (24h): ${recentEvents?.length ?? 0}`,
    `- Upcoming reminders: ${upcomingReminders?.length ?? 0}`,
  ].join("\n");

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: openai(process.env.MORA_MODEL || "gpt-4.1-nano"),
    system,
    messages: modelMessages,
    stopWhen: stepCountIs(6),
    tools: {
      get_baby_profile: tool({
        description: "Get the active baby profile and measurement settings.",
        inputSchema: z.object({}),
        execute: async () => {
          return await convex.query(api.events.getBabyProfile, {});
        },
      }),
      get_recent_events: tool({
        description: "Fetch recent live events for the active baby. Default is 24 hours.",
        inputSchema: z.object({
          hours: z.number().int().min(1).max(168).optional(),
          type: z.string().optional(),
          limit: z.number().int().min(1).max(200).optional(),
        }),
        execute: async ({ hours = 24, type, limit = 50 }) => {
          const profile = await convex.query(api.events.getBabyProfile, {});
          if (!profile?._id) return [];
          const from = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
          return await convex.query(api.events.listEvents, {
            babyId: profile._id,
            from,
            to: new Date().toISOString(),
            type,
            limit,
          } as any);
        },
      }),
      get_historic_events: tool({
        description: "Fetch historic events by date range and optional type.",
        inputSchema: z.object({
          from: z.string(),
          to: z.string(),
          type: z.string().optional(),
          limit: z.number().int().min(1).max(200).optional(),
        }),
        execute: async ({ from, to, type, limit = 100 }) => {
          const profile = await convex.query(api.events.getBabyProfile, {});
          if (!profile?._id) return [];
          return await convex.query(api.events.listEvents, {
            babyId: profile._id,
            from,
            to,
            type,
            limit,
          } as any);
        },
      }),
      get_daily_summary: tool({
        description: "Get aggregate summary for a given date (YYYY-MM-DD), defaults to today.",
        inputSchema: z.object({
          date: z.string().optional(),
        }),
        execute: async ({ date }) => {
          const profile = await convex.query(api.events.getBabyProfile, {});
          if (!profile?._id) return null;
          const day = date ?? new Date().toISOString().split("T")[0];
          return await convex.query(api.events.getDailyAggregates, {
            babyId: profile._id,
            date: day,
          } as any);
        },
      }),
      get_range_summary: tool({
        description: "Get aggregated summaries over a date-time range.",
        inputSchema: z.object({
          from: z.string(),
          to: z.string(),
        }),
        execute: async ({ from, to }) => {
          const profile = await convex.query(api.events.getBabyProfile, {});
          if (!profile?._id) return null;
          return await convex.query(api.events.getRangeAggregates, {
            babyId: profile._id,
            from,
            to,
          } as any);
        },
      }),
      get_reminders: tool({
        description: "Get reminder rules and upcoming reminders for the active baby.",
        inputSchema: z.object({}),
        execute: async () => {
          const profile = await convex.query(api.events.getBabyProfile, {});
          if (!profile?._id) return { rules: [], upcoming: [] };
          const [rules, upcoming] = await Promise.all([
            convex.query(api.events.listReminderRules, { babyId: profile._id } as any),
            convex.query(api.events.computeUpcomingReminders, { babyId: profile._id } as any),
          ]);
          return { rules, upcoming };
        },
      }),
      get_last_events_by_type: tool({
        description: "Get the latest event for one or more event types.",
        inputSchema: z.object({
          eventTypes: z.array(z.string()).min(1).max(10),
        }),
        execute: async ({ eventTypes }) => {
          const profile = await convex.query(api.events.getBabyProfile, {});
          if (!profile?._id) return {};
          return await convex.query(api.events.getLastEventsByTypes, {
            babyId: profile._id,
            eventTypes,
          } as any);
        },
      }),
      search_records: tool({
        description: "Search note text and event payload JSON heuristically across recent history.",
        inputSchema: z.object({
          query: z.string().min(1),
          days: z.number().int().min(1).max(90).optional(),
          limit: z.number().int().min(1).max(100).optional(),
        }),
        execute: async ({ query, days = 30, limit = 50 }) => {
          const profile = await convex.query(api.events.getBabyProfile, {});
          if (!profile?._id) return [];
          const events = await convex.query(api.events.listEvents, {
            babyId: profile._id,
            from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString(),
            limit: 500,
          } as any);
          const q = query.toLowerCase();
          return (events || [])
            .filter(
              (event: any) =>
                JSON.stringify(event.payload ?? {}).toLowerCase().includes(q) ||
                JSON.stringify(event).toLowerCase().includes(q)
            )
            .slice(0, limit);
        },
      }),
      create_event: tool({
        description: "Create a baby event (feed, diaper, sleep, meds, note, growth, pump).",
        inputSchema: z.object({
          type: z.string(),
          timestamp: z.string().optional(),
          payload: z.record(z.string(), z.any()).optional(),
          preview: z.string().optional(),
        }),
        execute: async ({ type, timestamp, payload, preview }) => {
          return await queueOrExecuteWrite({
            convex,
            threadId: threadId || "",
            actionType: "event.create",
            payload: { type, timestamp, payload },
            preview: preview ?? `Create event ${type}`,
            latestUserText,
          });
        },
      }),
      update_event: tool({
        description: "Update an existing event by id.",
        inputSchema: z.object({
          id: z.string(),
          timestamp: z.string().optional(),
          payload: z.record(z.string(), z.any()).optional(),
          preview: z.string().optional(),
        }),
        execute: async ({ id, timestamp, payload, preview }) => {
          return await queueOrExecuteWrite({
            convex,
            threadId: threadId || "",
            actionType: "event.update",
            payload: { id, timestamp, payload },
            preview: preview ?? `Update event ${id}`,
            latestUserText,
          });
        },
      }),
      delete_event: tool({
        description: "Delete an event by id. Requires explicit delete intent in the user's latest message.",
        inputSchema: z.object({
          id: z.string(),
          preview: z.string().optional(),
        }),
        execute: async ({ id, preview }) => {
          return await queueOrExecuteWrite({
            convex,
            threadId: threadId || "",
            actionType: "event.delete",
            payload: { id },
            preview: preview ?? `Delete event ${id}`,
            latestUserText,
          });
        },
      }),
      create_note: tool({
        description: "Create a NOTE event in the event log.",
        inputSchema: z.object({
          text: z.string().min(1),
          timestamp: z.string().optional(),
        }),
        execute: async ({ text, timestamp }) => {
          return await queueOrExecuteWrite({
            convex,
            threadId: threadId || "",
            actionType: "note.create",
            payload: { text, timestamp },
            preview: `Create note: ${text.slice(0, 80)}`,
            latestUserText,
          });
        },
      }),
      create_reminder: tool({
        description: "Create a reminder rule.",
        inputSchema: z.object({
          title: z.string(),
          category: z.string().optional(),
          triggerType: z.string().optional(),
          triggerConfig: z.record(z.string(), z.any()).optional(),
          enabled: z.boolean().optional(),
          preview: z.string().optional(),
        }),
        execute: async ({ preview, ...payload }) => {
          return await queueOrExecuteWrite({
            convex,
            threadId: threadId || "",
            actionType: "reminder.create",
            payload,
            preview: preview ?? `Create reminder: ${payload.title}`,
            latestUserText,
          });
        },
      }),
      update_reminder: tool({
        description: "Update a reminder rule by id.",
        inputSchema: z.object({
          id: z.string(),
          title: z.string().optional(),
          triggerType: z.string().optional(),
          triggerConfig: z.record(z.string(), z.any()).optional(),
          enabled: z.boolean().optional(),
          quietHoursStart: z.number().optional(),
          quietHoursEnd: z.number().optional(),
          snoozeOptions: z.any().optional(),
          preview: z.string().optional(),
        }),
        execute: async ({ preview, ...payload }) => {
          return await queueOrExecuteWrite({
            convex,
            threadId: threadId || "",
            actionType: "reminder.update",
            payload,
            preview: preview ?? `Update reminder ${payload.id}`,
            latestUserText,
          });
        },
      }),
      delete_reminder: tool({
        description: "Delete a reminder rule by id. Requires explicit delete intent.",
        inputSchema: z.object({
          id: z.string(),
          preview: z.string().optional(),
        }),
        execute: async ({ id, preview }) => {
          return await queueOrExecuteWrite({
            convex,
            threadId: threadId || "",
            actionType: "reminder.delete",
            payload: { id },
            preview: preview ?? `Delete reminder ${id}`,
            latestUserText,
          });
        },
      }),
      analyze_patterns: tool({
        description:
          "Analyze recent event patterns (feeding, diaper, sleep) over the last N days. " +
          "Returns average intervals, typical times, and suggested reminder configs. " +
          "Use this proactively when the user asks about patterns, or when suggesting smart reminders.",
        inputSchema: z.object({
          days: z.number().int().min(1).max(30).optional(),
          eventTypes: z.array(z.string()).optional(),
        }),
        execute: async ({ days = 7, eventTypes }) => {
          const profile = await convex.query(api.events.getBabyProfile, {});
          if (!profile?._id) return { error: "No baby profile" };

          const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
          const to = new Date().toISOString();

          const typesToAnalyze = eventTypes ?? [
            "FEED_BOTTLE", "FEED_BREAST", "DIAPER", "SLEEP", "MED_DOSE",
          ];

          const results: Record<string, any> = {};

          for (const type of typesToAnalyze) {
            const events = await convex.query(api.events.listEvents, {
              babyId: profile._id,
              from,
              to,
              type,
              limit: 500,
            } as any);

            if (!events || events.length < 2) {
              results[type] = { count: events?.length ?? 0, intervalHours: null, suggestion: null };
              continue;
            }

            const timestamps = events
              .map((e: any) => new Date(e.timestamp).getTime())
              .sort((a: number, b: number) => a - b);

            const intervals: number[] = [];
            for (let i = 1; i < timestamps.length; i++) {
              intervals.push((timestamps[i] - timestamps[i - 1]) / (1000 * 60 * 60));
            }

            const avgHours = intervals.reduce((s, v) => s + v, 0) / intervals.length;
            const medianHours = intervals.sort((a, b) => a - b)[Math.floor(intervals.length / 2)];
            const minHours = Math.min(...intervals);
            const maxHours = Math.max(...intervals);

            const hours = timestamps.map((t: number) => new Date(t).getHours());
            const hourCounts: Record<number, number> = {};
            hours.forEach((h: number) => { hourCounts[h] = (hourCounts[h] || 0) + 1; });
            const peakHours = Object.entries(hourCounts)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 3)
              .map(([h]) => Number(h));

            const roundedInterval = Math.round(avgHours * 2) / 2;

            results[type] = {
              count: events.length,
              daysAnalyzed: days,
              avgIntervalHours: Math.round(avgHours * 10) / 10,
              medianIntervalHours: Math.round(medianHours * 10) / 10,
              minIntervalHours: Math.round(minHours * 10) / 10,
              maxIntervalHours: Math.round(maxHours * 10) / 10,
              peakHoursOfDay: peakHours,
              perDay: Math.round((events.length / days) * 10) / 10,
              suggestedReminder: {
                title: `${type.replace(/_/g, " ")} reminder`,
                intervalHours: roundedInterval,
                triggerType: "afterLastEventType",
                triggerConfig: {
                  lastEventType: type,
                  intervalHours: roundedInterval,
                },
              },
            };
          }

          const existingRules = await convex.query(api.events.listReminderRules, {
            babyId: profile._id,
          } as any);

          return {
            patterns: results,
            existingReminderCount: existingRules?.length ?? 0,
            existingReminders: (existingRules ?? []).map((r: any) => ({
              id: r._id,
              title: r.title,
              category: r.category,
              triggerType: r.triggerType,
              enabled: r.enabled,
            })),
          };
        },
      }),
      check_nudges: tool({
        description:
          "Check for proactive nudges — unusual gaps in feeding, diapers, or sleep " +
          "compared to the baby's historical averages. Also checks for skipped meds. " +
          "Use when user asks 'anything I should know?' or 'is everything on track?'",
        inputSchema: z.object({}),
        execute: async () => {
          const profile = await convex.query(api.events.getBabyProfile, {});
          if (!profile?._id) return { nudges: [] };
          return await convex.query(api.nudges.getActiveNudges, { babyId: profile._id });
        },
      }),
      generate_weekly_digest: tool({
        description:
          "Generate a weekly digest comparing this week vs last week. " +
          "Returns stats comparison and an AI-written summary. " +
          "Use when user asks for a weekly summary, report, or digest.",
        inputSchema: z.object({}),
        execute: async () => {
          const profile = await convex.query(api.events.getBabyProfile, {});
          if (!profile?._id) return { error: "No baby profile" };

          const comparison = await convex.query(api.digest.getWeeklyComparison, {
            babyId: profile._id,
          });

          return {
            babyName: profile.name,
            ...comparison,
            hint: "Present this data as a friendly weekly digest. Compare this week vs last week. Highlight improvements and flag any concerns.",
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
