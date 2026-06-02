import { mutation } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { rateLimiter } from "./rateLimiter";

/**
 * Per-user rate-limit gate for the Next AI HTTP routes (transcribe, digest).
 * Returns `{ limited: true }` when the limit is exceeded so the caller can map
 * only that case to a 429. Auth failures and internal errors propagate (the
 * route turns them into 401/500) rather than masquerading as "too many requests".
 */
export const checkAiHttpLimit = mutation({
  args: {},
  handler: async (ctx): Promise<{ limited: boolean }> => {
    const user = await requireAuth(ctx);
    const { ok } = await rateLimiter.limit(ctx, "aiHttpRoute", { key: user._id });
    return { limited: !ok };
  },
});
