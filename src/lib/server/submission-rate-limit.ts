import "server-only";

import { hmacFingerprint, requestClientData } from "./request-guard";
import { assertDatabaseResult, getSupabaseAdmin } from "./supabase-admin";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 5;

export class RequestSecurityConfigurationError extends Error {
  constructor() {
    super("REQUEST_FINGERPRINT_SECRET non configurata o troppo corta");
    this.name = "RequestSecurityConfigurationError";
  }
}

export class SubmissionRateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Hai inviato troppe richieste. Riprova tra un'ora.");
    this.name = "SubmissionRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function fingerprintSecret() {
  const secret = process.env.REQUEST_FINGERPRINT_SECRET?.trim();
  if (!secret || new TextEncoder().encode(secret).byteLength < 32) {
    throw new RequestSecurityConfigurationError();
  }
  return secret;
}

export function submissionHashes(request: Request) {
  const { ip } = requestClientData(request);
  const secret = fingerprintSecret();
  return {
    ipHash: hmacFingerprint(ip, secret),
  };
}

export async function assertSubmissionRateLimit(ipHash: string) {
  const { data, error } = await getSupabaseAdmin().rpc("consume_rate_limit", {
    p_scope: "submission",
    p_key_hash: ipHash,
    p_limit: MAX_REQUESTS,
    p_window_seconds: WINDOW_MS / 1000,
  });
  assertDatabaseResult(error, "verifica limite richieste");
  const result = data?.[0];

  if (!result) {
    throw new Error("Risposta rate limit non disponibile");
  }
  if (!result.allowed) {
    throw new SubmissionRateLimitError(result.retry_after_seconds);
  }
}
