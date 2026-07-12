import "server-only";

import { adminSessionSecret } from "./admin-config";
import {
  hmacFingerprint,
  requestClientData,
} from "./request-guard";
import { assertDatabaseResult, getSupabaseAdmin } from "./supabase-admin";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 12;
const AUDIT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export type AdminAuthStage = "password" | "totp" | "phrase";

export class AdminRateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Troppi tentativi. Riprova più tardi.");
    this.name = "AdminRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function adminRequestFingerprint(request: Request) {
  const { ip, userAgent } = requestClientData(request);
  const secret = adminSessionSecret();
  const ipHash = hmacFingerprint(ip, secret);
  const userAgentHash = hmacFingerprint(userAgent, secret);
  return {
    ipHash,
    userAgentHash,
    fingerprintHash: hmacFingerprint(`${ipHash}:${userAgentHash}`, secret),
  };
}

export async function assertAdminRateLimit(ipHash: string) {
  const { data, error } = await getSupabaseAdmin().rpc("consume_rate_limit", {
    p_scope: "admin",
    p_key_hash: ipHash,
    p_limit: MAX_ATTEMPTS,
    p_window_seconds: WINDOW_MS / 1000,
  });
  assertDatabaseResult(error, "verifica limite accessi");
  const result = data?.[0];

  if (!result) {
    throw new Error("Risposta rate limit non disponibile");
  }
  if (!result.allowed) {
    throw new AdminRateLimitError(result.retry_after_seconds);
  }
}

export async function recordAdminAttempt(
  request: Request,
  stage: AdminAuthStage,
  successful: boolean,
  reason?: string,
) {
  const fingerprint = adminRequestFingerprint(request);
  const db = getSupabaseAdmin();

  // Opportunistic retention enforcement for pseudonymized audit records.
  await db
    .from("admin_login_attempts")
    .delete()
    .lt("created_at", new Date(Date.now() - AUDIT_RETENTION_MS).toISOString());

  const { error } = await db
    .from("admin_login_attempts")
    .insert({
      fingerprint_hash: fingerprint.fingerprintHash,
      ip_hash: fingerprint.ipHash,
      user_agent_hash: fingerprint.userAgentHash,
      stage,
      successful,
      reason: reason?.slice(0, 120) ?? null,
    });
  assertDatabaseResult(error, "audit accesso amministratore");
}
