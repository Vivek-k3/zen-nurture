import { MINUTE, RateLimiter, SECOND } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

/**
 * Rate limits for Mora's AI usage.
 *
 * - `sendMessage` / `globalSendMessage` gate request frequency (checked up
 *   front in moraChat.streamChat).
 * - `tokenUsagePerUser` / `globalTokenUsage` gate token spend; actual usage is
 *   reserved after each generation in the agent usageHandler (convex/usage.ts).
 */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // ~1 message / 3s per user, small burst.
  sendMessage: { kind: "fixed window", period: 3 * SECOND, rate: 1, capacity: 3 },
  // Per-user cap for the Next AI HTTP routes (transcribe, digest): 10/min, burst 15.
  aiHttpRoute: { kind: "fixed window", period: MINUTE, rate: 10, capacity: 15 },
  // Per-user token budget: 20k tokens/min, burst up to 50k.
  tokenUsagePerUser: {
    kind: "token bucket",
    period: MINUTE,
    rate: 20_000,
    capacity: 50_000,
  },
  // Global safety caps across all users.
  globalSendMessage: { kind: "token bucket", period: MINUTE, rate: 1_000 },
  globalTokenUsage: { kind: "token bucket", period: MINUTE, rate: 1_000_000 },
});
