import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { adminSessionSecret } from "./admin-config";
import { assertDatabaseResult, getSupabaseAdmin } from "./supabase-admin";

export const ADMIN_SESSION_COOKIE = "voicyy_admin_session";
export const ADMIN_FLOW_COOKIE = "voicyy_admin_flow";

export type AdminFlowStep = "totp" | "phrase";
export type AdminFlowState = {
  step: AdminFlowStep;
  jtiHash: string;
};

const encoder = new TextEncoder();
const issuer = "voicyy-admin";
const FLOW_SECONDS = 10 * 60;
const SESSION_SECONDS = 20 * 60;

function signingKey() {
  return encoder.encode(adminSessionSecret());
}

function tokenHash(jti: string) {
  return createHash("sha256").update(jti, "utf8").digest("hex");
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
    priority: "high" as const,
  };
}

async function verifiedPayload(
  token: string,
  audience: "voicyy-admin-flow" | "voicyy-admin-dashboard",
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      algorithms: ["HS256"],
      issuer,
      audience,
    });
    return payload;
  } catch {
    return null;
  }
}

async function pruneExpiredAdminTokens() {
  const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const db = getSupabaseAdmin();
  await Promise.all([
    db.from("admin_auth_flows").delete().lt("expires_at", threshold),
    db.from("admin_sessions").delete().lt("expires_at", threshold),
  ]);
}

export async function createFlowToken(
  step: AdminFlowStep,
  fingerprintHash: string,
) {
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + FLOW_SECONDS * 1000);
  const { error } = await getSupabaseAdmin().from("admin_auth_flows").insert({
    jti_hash: tokenHash(jti),
    fingerprint_hash: fingerprintHash,
    step,
    expires_at: expiresAt.toISOString(),
  });
  assertDatabaseResult(error, "creazione flusso amministratore");
  await pruneExpiredAdminTokens();

  return new SignJWT({ kind: "admin-flow", step, fingerprintHash })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(issuer)
    .setAudience("voicyy-admin-flow")
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(signingKey());
}

export async function readFlowToken(
  fingerprintHash: string,
): Promise<AdminFlowState | null> {
  const token = (await cookies()).get(ADMIN_FLOW_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifiedPayload(token, "voicyy-admin-flow");
  if (
    !payload ||
    payload.kind !== "admin-flow" ||
    payload.fingerprintHash !== fingerprintHash ||
    typeof payload.jti !== "string" ||
    (payload.step !== "totp" && payload.step !== "phrase")
  ) {
    return null;
  }

  const jtiHash = tokenHash(payload.jti);
  const { data, error } = await getSupabaseAdmin()
    .from("admin_auth_flows")
    .select("step")
    .eq("jti_hash", jtiHash)
    .eq("fingerprint_hash", fingerprintHash)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  assertDatabaseResult(error, "verifica flusso amministratore");
  if (!data || data.step !== payload.step) return null;

  return { step: payload.step, jtiHash };
}

export async function consumeFlowToken(flow: AdminFlowState) {
  const { data, error } = await getSupabaseAdmin()
    .from("admin_auth_flows")
    .update({ consumed_at: new Date().toISOString() })
    .eq("jti_hash", flow.jtiHash)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("jti_hash")
    .maybeSingle();
  assertDatabaseResult(error, "consumo flusso amministratore");
  return Boolean(data);
}

export async function createAdminSessionToken() {
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
  const { error } = await getSupabaseAdmin().from("admin_sessions").insert({
    jti_hash: tokenHash(jti),
    expires_at: expiresAt.toISOString(),
  });
  assertDatabaseResult(error, "creazione sessione amministratore");
  await pruneExpiredAdminTokens();

  return new SignJWT({ kind: "admin-session", role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(issuer)
    .setAudience("voicyy-admin-dashboard")
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(signingKey());
}

async function currentSessionJtiHash() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifiedPayload(token, "voicyy-admin-dashboard");
  if (
    !payload ||
    payload.kind !== "admin-session" ||
    payload.role !== "admin" ||
    typeof payload.jti !== "string"
  ) {
    return null;
  }
  return tokenHash(payload.jti);
}

export async function hasValidAdminSession() {
  const jtiHash = await currentSessionJtiHash();
  if (!jtiHash) return false;
  const { data, error } = await getSupabaseAdmin()
    .from("admin_sessions")
    .select("jti_hash")
    .eq("jti_hash", jtiHash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  assertDatabaseResult(error, "verifica sessione amministratore");
  return Boolean(data);
}

export async function revokeCurrentAdminSession() {
  const jtiHash = await currentSessionJtiHash();
  if (!jtiHash) return;
  const { error } = await getSupabaseAdmin()
    .from("admin_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("jti_hash", jtiHash)
    .is("revoked_at", null);
  assertDatabaseResult(error, "revoca sessione amministratore");
}

export function setFlowCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_FLOW_COOKIE, token, cookieOptions(FLOW_SECONDS));
}

export function setAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    token,
    cookieOptions(SESSION_SECONDS),
  );
}

export function clearFlowCookie(response: NextResponse) {
  response.cookies.set(ADMIN_FLOW_COOKIE, "", cookieOptions(0));
}

export function clearAdminCookies(response: NextResponse) {
  response.cookies.set(ADMIN_FLOW_COOKIE, "", cookieOptions(0));
  response.cookies.set(ADMIN_SESSION_COOKIE, "", cookieOptions(0));
}
