import { mutation } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { rateLimiter } from "./rateLimiter";

/**
 * Per-user rate-limit gate for the Next AI HTTP routes (transcribe, digest).
 * Throws when the limit is exceeded; the calling route maps that to a 429.
 */
export const checkAiHttpLimit = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    await rateLimiter.limit(ctx, "aiHttpRoute", { key: user._id, throws: true });
    return null;
  },
});
