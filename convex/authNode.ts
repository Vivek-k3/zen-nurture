"use node";

import { type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { dash } from "@better-auth/infra";
import { betterAuth } from "better-auth/minimal";
import { v } from "convex/values";
import type { DataModel } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";
import authConfig from "./auth.config";
import { authComponent } from "./auth";

const createAuth = (ctx: GenericCtx<DataModel>) => {
  const baseURL = process.env.SITE_URL!;
  const betterAuthApiUrl = process.env.BETTER_AUTH_API_URL ?? "https://beta.better-auth.com";
  const betterAuthKvUrl = process.env.BETTER_AUTH_KV_URL ?? "https://kv.better-auth.com";
  const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((s) => s.trim())
    : [baseURL, "http://localhost:3000", "http://localhost:3001", "http://zen.localhost:1355"];
  const isLocal =
    baseURL.includes("localhost") || baseURL.includes("127.0.0.1");
  const infraPlugins = process.env.BETTER_AUTH_API_KEY
    ? [
        dash({
          apiUrl: betterAuthApiUrl,
          kvUrl: betterAuthKvUrl,
          apiKey: process.env.BETTER_AUTH_API_KEY,
        }),
      ]
    : [];

  return betterAuth({
    baseURL,
    trustedOrigins,
    advanced: {
      // Workaround: Better Auth 1.4.x bug where trustedOrigins is disregarded (GH#6798, #6944)
      disableOriginCheck: isLocal,
    },
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [...infraPlugins, convex({ authConfig })],
  });
};

export const handleAuthRequest = internalAction({
  args: {
    method: v.string(),
    url: v.string(),
    headers: v.array(v.object({ key: v.string(), value: v.string() })),
    bodyText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const requestHeaders: [string, string][] = args.headers.map(({ key, value }) => [
      key,
      value,
    ]);
    const request = new Request(args.url, {
      method: args.method,
      headers: requestHeaders,
      body:
        args.method === "GET" || args.method === "HEAD"
          ? undefined
          : (args.bodyText ?? ""),
    });

    const response = await createAuth(ctx).handler(request);
    const headers: { key: string; value: string }[] = [];
    response.headers.forEach((value, key) => {
      headers.push({ key, value });
    });

    return {
      status: response.status,
      headers,
      bodyText: await response.text(),
    };
  },
});
