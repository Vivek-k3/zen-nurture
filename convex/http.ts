import { httpRouter } from "convex/server";
import { handleAuthHttp, redirectOpenIdConfiguration } from "./authHttp";
import { getSubsForCron, unsubscribeStaleEndpoint } from "./pushCron";

const http = httpRouter();

http.route({
  path: "/.well-known/openid-configuration",
  method: "GET",
  handler: redirectOpenIdConfiguration,
});

http.route({
  pathPrefix: "/api/auth/",
  method: "GET",
  handler: handleAuthHttp,
});

http.route({
  path: "/api/auth",
  method: "GET",
  handler: handleAuthHttp,
});

http.route({
  pathPrefix: "/api/auth/",
  method: "POST",
  handler: handleAuthHttp,
});

http.route({
  path: "/api/auth",
  method: "POST",
  handler: handleAuthHttp,
});

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
