import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { getSubsForCron, unsubscribeStaleEndpoint } from "./pushCron";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

http.route({
  path: "/api/push/cron-subs",
  method: "POST",
  handler: getSubsForCron,
});

http.route({
  path: "/api/push/cron-unsubscribe",
  method: "POST",
  handler: unsubscribeStaleEndpoint,
});

export default http;
