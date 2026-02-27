import { NextRequest } from "next/server";

const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "";

/**
 * Proxies an incoming NextRequest to the configured CONVEX_SITE_URL and returns the upstream response.
 *
 * Constructs a target URL by appending the incoming request's path and query to CONVEX_SITE_URL, forwards the incoming headers (excluding `host`, `transfer-encoding`, `connection`, and `content-length`), sets the `host` header to the CONVEX_SITE_URL host, and forwards the request body for methods other than GET and HEAD. Copies response status, statusText and response body from the upstream response while excluding `transfer-encoding`, `connection`, `content-encoding`, and `content-length` response headers.
 *
 * @param request - The incoming NextRequest to forward to the upstream site.
 * @returns The Response from the upstream site, or a JSON error response with status 500 if CONVEX_SITE_URL is not configured, or 502 if the proxy fetch fails.
 */
async function proxy(request: NextRequest): Promise<Response> {
  if (!CONVEX_SITE_URL) {
    return Response.json({ error: "CONVEX_SITE_URL not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const target = `${CONVEX_SITE_URL}${url.pathname}${url.search}`;

  const fwdHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (
      key === "host" ||
      key === "transfer-encoding" ||
      key === "connection" ||
      key === "content-length"
    ) {
      return;
    }
    fwdHeaders[key] = value;
  });
  fwdHeaders["host"] = new URL(CONVEX_SITE_URL).host;

  try {
    const resp = await fetch(target, {
      method: request.method,
      headers: fwdHeaders,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
      redirect: "manual",
    });

    const respHeaders = new Headers();
    resp.headers.forEach((value, key) => {
      if (
        key === "transfer-encoding" ||
        key === "connection" ||
        key === "content-encoding" ||
        key === "content-length"
      ) {
        return;
      }
      respHeaders.append(key, value);
    });

    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: respHeaders,
    });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Proxy error" }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  return proxy(request);
}

export async function POST(request: NextRequest) {
  return proxy(request);
}
