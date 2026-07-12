import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AdminConfigurationError } from "./admin-config";
import { AdminRateLimitError } from "./admin-rate-limit";
import { RequestGuardError } from "./request-guard";
import { DatabaseConfigurationError } from "./supabase-admin";

export function adminJson(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, private");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export function adminApiError(error: unknown) {
  if (error instanceof ZodError) {
    return adminJson(
      { ok: false, error: "Formato dei dati non valido" },
      { status: 422 },
    );
  }
  if (error instanceof RequestGuardError) {
    return adminJson({ ok: false, error: error.message }, { status: error.status });
  }
  if (error instanceof AdminRateLimitError) {
    const response = adminJson(
      { ok: false, error: error.message },
      { status: 429 },
    );
    response.headers.set("Retry-After", String(error.retryAfterSeconds));
    return response;
  }
  if (
    error instanceof AdminConfigurationError ||
    error instanceof DatabaseConfigurationError
  ) {
    return adminJson(
      { ok: false, error: error.message },
      { status: 503 },
    );
  }
  return adminJson(
    { ok: false, error: "Operazione non riuscita" },
    { status: 500 },
  );
}
