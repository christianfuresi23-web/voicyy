import "server-only";

import { createHmac } from "node:crypto";

export class RequestGuardError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RequestGuardError";
    this.status = status;
  }
}

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function allowedOrigins(request: Request) {
  const origins = new Set<string>();
  const configuredUrls = [
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined,
  ];

  for (const value of configuredUrls) {
    if (!value) continue;
    const origin = normalizeOrigin(value);
    if (origin) origins.add(origin);
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    const protocol =
      request.headers.get("x-forwarded-proto") ??
      (process.env.NODE_ENV === "production" ? "https" : "http");
    const origin = normalizeOrigin(`${protocol}://${host}`);
    if (origin) origins.add(origin);
  }

  return origins;
}

export function assertSameOrigin(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    throw new RequestGuardError("Origine della richiesta non consentita", 403);
  }

  const suppliedOrigin = request.headers.get("origin");
  if (!suppliedOrigin) {
    if (process.env.NODE_ENV === "production") {
      throw new RequestGuardError("Header Origin mancante", 403);
    }
    return;
  }

  const origin = normalizeOrigin(suppliedOrigin);
  if (!origin || !allowedOrigins(request).has(origin)) {
    throw new RequestGuardError("Origine della richiesta non consentita", 403);
  }
}

export async function readJsonBody(
  request: Request,
  maximumBytes = 64 * 1024,
): Promise<unknown> {
  assertSameOrigin(request);

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.split(";", 1)[0]?.trim() !== "application/json") {
    throw new RequestGuardError("Content-Type deve essere application/json", 415);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    throw new RequestGuardError("Richiesta troppo grande", 413);
  }

  const reader = request.body?.getReader();
  const decoder = new TextDecoder();
  let receivedBytes = 0;
  let body = "";

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
      if (receivedBytes > maximumBytes) {
        await reader.cancel();
        throw new RequestGuardError("Richiesta troppo grande", 413);
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new RequestGuardError("JSON non valido", 400);
  }
}

export function requestClientData(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = (forwarded.split(",")[0] || request.headers.get("x-real-ip") || "unknown")
    .trim()
    .slice(0, 128);
  const userAgent = (request.headers.get("user-agent") ?? "unknown").slice(0, 512);
  return { ip, userAgent };
}

export function hmacFingerprint(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}
