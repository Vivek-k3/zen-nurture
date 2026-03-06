import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { sentinelClient } from "@better-auth/infra/client";
 
export const authClient = createAuthClient({
  plugins: [convexClient(), sentinelClient()],
});
