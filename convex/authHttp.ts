import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const authNode = (internal as any).authNode;

export const handleAuthHttp = httpAction(async (ctx, request) => {
  const bodyText =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();
  const headers: { key: string; value: string }[] = [];
  request.headers.forEach((value, key) => {
    headers.push({ key, value });
  });

  const response = await ctx.runAction(authNode.handleAuthRequest, {
    method: request.method,
    url: request.url,
    headers,
    bodyText,
  });

  const responseHeaders = new Headers();
  for (const { key, value } of response.headers) {
    responseHeaders.append(key, value);
  }

  return new Response(response.bodyText, {
    status: response.status,
    headers: responseHeaders,
  });
});

export const redirectOpenIdConfiguration = httpAction(async () => {
  return Response.redirect(
    `${process.env.CONVEX_SITE_URL}/api/auth/convex/.well-known/openid-configuration`
  );
});
