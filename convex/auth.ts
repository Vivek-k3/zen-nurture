import { createClient } from "@convex-dev/better-auth";
import type { DataModel } from "./_generated/dataModel";
import { components } from "./_generated/api";

export const authComponent = createClient<DataModel>(components.betterAuth);

export const { getAuthUser } = authComponent.clientApi();
