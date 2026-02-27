import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import type { DataModel } from "./_generated/dataModel";
import { components } from "./_generated/api";
import authConfig from "./auth.config";

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  const baseURL = process.env.SITE_URL!;
  const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((s) => s.trim())
    : [baseURL, "http://localhost:3000", "http://localhost:3001", "http://zen.localhost:1355"];
  const isLocal =
    baseURL.includes("localhost") || baseURL.includes("127.0.0.1");

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
    plugins: [convex({ authConfig })],
  });
};

export const { getAuthUser } = authComponent.clientApi();
