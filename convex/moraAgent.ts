import { Agent, createTool, stepCountIs } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { components, api } from "./_generated/api";
import { moraUsageHandler } from "./usage";

/**
 * Static system prompt for Mora. Per-request dynamic context (user, baby,
 * page, settings) is appended via the `system` override in moraChat.streamChat.
 */
export const MORA_INSTRUCTIONS = [
  "You are Mora, an AI caregiver copilot inside Zen Nurture — a calm, India-first baby care tracker.",
  "",
  "## Personality",
  "- Warm, concise, action-oriented. Use tools for factual answers instead of guessing.",
  "- Address the user by first name when known. Reference the baby by name.",
  "",
  "## Smart Reminders",
  "- When the user asks about patterns, feeding schedules, or reminders, use analyze_patterns first.",
  "- If you detect a clear interval (e.g. baby feeds every ~2.5h), proactively suggest creating a reminder.",
  "- Phrase suggestions naturally: 'Baby usually feeds every 2.5 hours. Want me to set a reminder for that?'",
  "- Compare with existing reminders to avoid duplicates.",
  "",
  "## Proactive Nudges",
  "- When user asks 'anything I should know?', 'is everything OK?', or 'status check', use check_nudges.",
  "- If nudges exist, present them with empathy and suggest logging the event if overdue, or reassure if within normal range.",
  "",
  "## Weekly Digest",
  "- When user asks for a weekly summary/report/digest, use generate_weekly_digest and present the comparison in a friendly, scannable format with highlights and concerns.",
  "",
  "## Boundaries",
  "- Never fabricate data. If a tool returns empty, say so.",
  "- Never propose unsupported actions (clear all data, caregiver mutations, baby profile mutations).",
].join("\n");

/**
 * Read-only tools for the Mora agent. Each runs inside an authenticated action
 * context, so `ctx.runQuery` propagates the caller's identity and the existing
 * auth-enforcing queries (requireAuth / requireBabyAccess) work unchanged.
 *
 * Write tools (create/update/delete event/note/reminder) and their approval
 * gate are migrated in the Stage 4 cutover, alongside the client rewire.
 */
const tools = {
  get_baby_profile: createTool({
    description: "Get the active baby profile and measurement settings.",
    inputSchema: z.object({}),
    execute: async (ctx): Promise<unknown> => {
      return await ctx.runQuery(api.events.getBabyProfile, {});
    },
  }),

  get_recent_events: createTool({
    description: "Fetch recent live events for the active baby. Default is 24 hours.",
    inputSchema: z.object({
      hours: z.number().int().min(1).max(168).optional(),
      type: z.string().optional(),
      limit: z.number().int().min(1).max(200).optional(),
    }),
    execute: async (ctx, { hours = 24, type, limit = 50 }): Promise<unknown> => {
      const profile = await ctx.runQuery(api.events.getBabyProfile, {});
      if (!profile?._id) return [];
      const from = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      return await ctx.runQuery(api.events.listEvents, {
        babyId: profile._id,
        from,
        to: new Date().toISOString(),
        type,
        limit,
      });
    },
  }),

  get_historic_events: createTool({
    description: "Fetch historic events by date range and optional type.",
    inputSchema: z.object({
      from: z.string(),
      to: z.string(),
      type: z.string().optional(),
      limit: z.number().int().min(1).max(200).optional(),
    }),
    execute: async (ctx, { from, to, type, limit = 100 }): Promise<unknown> => {
      const profile = await ctx.runQuery(api.events.getBabyProfile, {});
      if (!profile?._id) return [];
      return await ctx.runQuery(api.events.listEvents, {
        babyId: profile._id,
        from,
        to,
        type,
        limit,
      });
    },
  }),

  get_daily_summary: createTool({
    description: "Get aggregate summary for a given date (YYYY-MM-DD), defaults to today.",
    inputSchema: z.object({ date: z.string().optional() }),
    execute: async (ctx, { date }): Promise<unknown> => {
      const profile = await ctx.runQuery(api.events.getBabyProfile, {});
      if (!profile?._id) return null;
      const day = date ?? new Date().toISOString().split("T")[0];
      return await ctx.runQuery(api.events.getDailyAggregates, {
        babyId: profile._id,
        date: day,
      });
    },
  }),

  get_range_summary: createTool({
    description: "Get aggregated summaries over a date-time range.",
    inputSchema: z.object({ from: z.string(), to: z.string() }),
    execute: async (ctx, { from, to }): Promise<unknown> => {
      const profile = await ctx.runQuery(api.events.getBabyProfile, {});
      if (!profile?._id) return null;
      return await ctx.runQuery(api.events.getRangeAggregates, {
        babyId: profile._id,
        from,
        to,
      });
    },
  }),

  get_reminders: createTool({
    description: "Get reminder rules and upcoming reminders for the active baby.",
    inputSchema: z.object({}),
    execute: async (ctx): Promise<unknown> => {
      const profile = await ctx.runQuery(api.events.getBabyProfile, {});
      if (!profile?._id) return { rules: [], upcoming: [] };
      const [rules, upcoming] = await Promise.all([
        ctx.runQuery(api.events.listReminderRules, { babyId: profile._id }),
        ctx.runQuery(api.events.computeUpcomingReminders, { babyId: profile._id }),
      ]);
      return { rules, upcoming };
    },
  }),

  get_last_events_by_type: createTool({
    description: "Get the latest event for one or more event types.",
    inputSchema: z.object({ eventTypes: z.array(z.string()).min(1).max(10) }),
    execute: async (ctx, { eventTypes }): Promise<unknown> => {
      const profile = await ctx.runQuery(api.events.getBabyProfile, {});
      if (!profile?._id) return {};
      return await ctx.runQuery(api.events.getLastEventsByTypes, {
        babyId: profile._id,
        eventTypes,
      });
    },
  }),

  search_records: createTool({
    description: "Search note text and event payload JSON heuristically across recent history.",
    inputSchema: z.object({
      query: z.string().min(1),
      days: z.number().int().min(1).max(90).optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }),
    execute: async (ctx, { query, days = 30, limit = 50 }): Promise<unknown> => {
      const profile = await ctx.runQuery(api.events.getBabyProfile, {});
      if (!profile?._id) return [];
      // Fetch a bounded multiple of the requested limit so substring matching
      // has headroom without scanning the whole history (listEvents .take()s this).
      const fetchLimit = Math.min(Math.max(limit * 5, 100), 200);
      const events = await ctx.runQuery(api.events.listEvents, {
        babyId: profile._id,
        from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
        limit: fetchLimit,
      });
      const q = query.toLowerCase();
      return (events || [])
        // Stringify each event once instead of twice (the payload is part of it).
        .filter((event) => JSON.stringify(event).toLowerCase().includes(q))
        .slice(0, limit);
    },
  }),

  analyze_patterns: createTool({
    description:
      "Analyze recent event patterns (feeding, diaper, sleep) over the last N days. " +
      "Returns average intervals, typical times, and suggested reminder configs. " +
      "Use this proactively when the user asks about patterns, or when suggesting smart reminders.",
    inputSchema: z.object({
      days: z.number().int().min(1).max(30).optional(),
      eventTypes: z.array(z.string()).optional(),
    }),
    execute: async (ctx, { days = 7, eventTypes }): Promise<unknown> => {
      const profile = await ctx.runQuery(api.events.getBabyProfile, {});
      if (!profile?._id) return { error: "No baby profile" };

      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();

      const typesToAnalyze = eventTypes ?? [
        "FEED_BOTTLE",
        "FEED_BREAST",
        "DIAPER",
        "SLEEP",
        "MED_DOSE",
      ];

      // Fetch every type's events in parallel with a bounded, days-scaled
      // limit. Sequential 500-row reads per type could load thousands of
      // events in one tool call and risk action timeouts during streaming.
      const perTypeLimit = Math.min(Math.max(days * 20, 100), 300);
      const eventsByType = await Promise.all(
        typesToAnalyze.map((type) =>
          ctx.runQuery(api.events.listEvents, {
            babyId: profile._id,
            from,
            to,
            type,
            limit: perTypeLimit,
          })
        )
      );

      const results: Record<string, unknown> = {};

      for (let i = 0; i < typesToAnalyze.length; i++) {
        const type = typesToAnalyze[i];
        const events = eventsByType[i];

        if (!events || events.length < 2) {
          results[type] = { count: events?.length ?? 0, intervalHours: null, suggestion: null };
          continue;
        }

        const timestamps = events
          .map((e) => new Date(e.timestamp).getTime())
          .sort((a, b) => a - b);

        const intervals: number[] = [];
        for (let i = 1; i < timestamps.length; i++) {
          intervals.push((timestamps[i] - timestamps[i - 1]) / (1000 * 60 * 60));
        }

        const avgHours = intervals.reduce((s, v) => s + v, 0) / intervals.length;
        const medianHours = intervals.sort((a, b) => a - b)[Math.floor(intervals.length / 2)];
        const minHours = Math.min(...intervals);
        const maxHours = Math.max(...intervals);

        const hours = timestamps.map((t) => new Date(t).getHours());
        const hourCounts: Record<number, number> = {};
        hours.forEach((h) => {
          hourCounts[h] = (hourCounts[h] || 0) + 1;
        });
        const peakHours = Object.entries(hourCounts)
          .sort(([, a], [, b]) => b - a)
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
            triggerConfig: { lastEventType: type, intervalHours: roundedInterval },
          },
        };
      }

      const existingRules = await ctx.runQuery(api.events.listReminderRules, {
        babyId: profile._id,
      });

      return {
        patterns: results,
        existingReminderCount: existingRules?.length ?? 0,
        existingReminders: (existingRules ?? []).map((r) => ({
          id: r._id,
          title: r.title,
          category: r.category,
          triggerType: r.triggerType,
          enabled: r.enabled,
        })),
      };
    },
  }),

  check_nudges: createTool({
    description:
      "Check for proactive nudges — unusual gaps in feeding, diapers, or sleep " +
      "compared to the baby's historical averages. Also checks for skipped meds. " +
      "Use when user asks 'anything I should know?' or 'is everything on track?'",
    inputSchema: z.object({}),
    execute: async (ctx): Promise<unknown> => {
      const profile = await ctx.runQuery(api.events.getBabyProfile, {});
      if (!profile?._id) return { nudges: [] };
      return await ctx.runQuery(api.nudges.getActiveNudges, {
        babyId: profile._id,
        now: new Date().toISOString(),
      });
    },
  }),

  generate_weekly_digest: createTool({
    description:
      "Generate a weekly digest comparing this week vs last week. " +
      "Returns the stats comparison to present as a friendly digest. " +
      "Use when user asks for a weekly summary, report, or digest.",
    inputSchema: z.object({}),
    execute: async (ctx): Promise<unknown> => {
      const profile = await ctx.runQuery(api.events.getBabyProfile, {});
      if (!profile?._id) return { error: "No baby profile" };
      const comparison = await ctx.runQuery(api.digest.getWeeklyComparison, {
        babyId: profile._id,
      });
      return {
        babyName: profile.name,
        ...comparison,
        hint: "Present this as a friendly weekly digest. Compare this week vs last week. Highlight improvements and flag any concerns.",
      };
    },
  }),
};

export const moraAgent = new Agent(components.agent, {
  name: "Mora",
  languageModel: openai.chat(process.env.MORA_MODEL || "gpt-4.1-nano"),
  instructions: MORA_INSTRUCTIONS,
  tools,
  stopWhen: stepCountIs(6),
  usageHandler: moraUsageHandler,
});
