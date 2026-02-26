import { betterAuth } from "better-auth";
import { convexAdapter } from "@convex-dev/better-auth";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000", // pragma: allowlist secret
  database: convexAdapter(convex),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
});
