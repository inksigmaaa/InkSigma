import { type NextRequest } from "next/server";
import { resolveBackendBaseUrl } from "../_lib/backend-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

const buildUpstreamHeaders = (request: NextRequest) => {
  const headers = new Headers();

  for (const [key, value] of request.headers.entries()) {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      continue;
    }

    headers.set(key, value);
  }

  headers.set("x-forwarded-host", request.headers.get("host") || request.nextUrl.host);
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(/:$/, ""));
  headers.set("x-proxied-by", "next-app-route");

  return headers;
};

const buildResponseHeaders = (upstreamHeaders: Headers) => {
  const headers = new Headers();

  for (const [key, value] of upstreamHeaders.entries()) {
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey === "set-cookie" ||
      normalizedKey === "content-encoding" ||
      HOP_BY_HOP_HEADERS.has(normalizedKey)
    ) {
      continue;
    }

    headers.set(key, value);
  }

  const getSetCookie = (
    upstreamHeaders as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie;

  if (typeof getSetCookie === "function") {
    for (const cookie of getSetCookie.call(upstreamHeaders)) {
      headers.append("set-cookie", cookie);
    }
  } else {
    const cookieHeader = upstreamHeaders.get("set-cookie");
    if (cookieHeader) {
      headers.append("set-cookie", cookieHeader);
    }
  }

  return headers;
};

const proxyRequest = async (
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) => {
  let backendBaseUrl: string;
  try {
    backendBaseUrl = resolveBackendBaseUrl();
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Backend URL is not configured for API proxying.",
      },
      { status: 500 },
    );
  }

  const { path = [] } = await context.params;
  const upstreamUrl = new URL(`/api/${path.join("/")}`, backendBaseUrl);
  upstreamUrl.search = request.nextUrl.search;

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers: buildUpstreamHeaders(request),
      body: METHODS_WITHOUT_BODY.has(request.method) ? undefined : await request.arrayBuffer(),
      redirect: "manual",
      cache: "no-store",
    });

    const responseBody = await upstreamResponse.arrayBuffer();

    return new Response(responseBody, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: buildResponseHeaders(upstreamResponse.headers),
    });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to reach backend service.",
        details: error instanceof Error ? error.message : "Unknown proxy error",
      },
      { status: 502 },
    );
  }
};

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const HEAD = proxyRequest;
export const OPTIONS = proxyRequest;
