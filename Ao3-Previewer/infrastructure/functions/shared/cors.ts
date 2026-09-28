import type { APIGatewayProxyEvent } from "aws-lambda";

// The site is served on both the apex and www domains (see CloudFront domainNames in
// lib/infrastructure-stack.ts), so responses must allow whichever one made the request.
const DEFAULT_ALLOWED_ORIGINS = ["https://ficformatter.com", "https://www.ficformatter.com", "https://d2gmcdwlhahrqc.cloudfront.net"];

function allowedOrigins(): string[] {
  const configured = process.env.ALLOWED_ORIGIN;
  return configured ? [configured] : DEFAULT_ALLOWED_ORIGINS;
}

function requestOrigin(event: Pick<APIGatewayProxyEvent, "headers">): string | undefined {
  const headers = event.headers ?? {};
  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() === "origin") return value ?? undefined;
  }
  return undefined;
}

/**
 * CORS headers for a Lambda response. Echoes the request's Origin when it's allowed, since
 * Access-Control-Allow-Origin can only hold one origin; otherwise falls back to the first
 * allowed origin, which the browser will reject for any other caller.
 */
export function corsHeaders(event: Pick<APIGatewayProxyEvent, "headers">) {
  const allowed = allowedOrigins();
  const origin = requestOrigin(event);
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin && allowed.includes(origin) ? origin : allowed[0]!,
    "Access-Control-Allow-Headers": "Content-Type",
    // The response differs by Origin, so caches must not serve one origin's response to another.
    Vary: "Origin",
  };
}
