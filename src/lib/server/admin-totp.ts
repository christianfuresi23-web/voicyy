import "server-only";

import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

import { decryptAdminSecret, encryptAdminSecret } from "./admin-crypto";
import {
  assertDatabaseResult,
  DatabaseOperationError,
  getSupabaseAdmin,
} from "./supabase-admin";

export type TotpState = {
  secret: string;
  enabled: boolean;
  lastTimeStep: number | null;
};

export async function ensureTotpState(): Promise<TotpState> {
  const db = getSupabaseAdmin();
  const candidateSecret = generateSecret({ length: 20 });
  const encryptedCandidate = encryptAdminSecret(candidateSecret);
  const now = new Date().toISOString();

  const { data: initial, error: initialError } = await db
    .from("admin_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  assertDatabaseResult(initialError, "lettura impostazioni TOTP");

  let existing = initial;
  if (!existing) {
    const { data: inserted, error: insertError } = await db
      .from("admin_settings")
      .insert({
      id: 1,
        totp_secret_encrypted: encryptedCandidate,
        totp_enabled: false,
        updated_at: now,
      })
      .select("*")
      .single();

    if (!insertError && inserted) {
      return { secret: candidateSecret, enabled: false, lastTimeStep: null };
    }
    if (insertError?.code !== "23505") {
      assertDatabaseResult(insertError, "creazione impostazioni TOTP");
    }

    const retry = await db
      .from("admin_settings")
      .select("*")
      .eq("id", 1)
      .single();
    assertDatabaseResult(retry.error, "rilettura impostazioni TOTP");
    existing = retry.data;
  }

  if (!existing?.totp_secret_encrypted) {
    const { data: updated, error: updateError } = await db
      .from("admin_settings")
      .update({ totp_secret_encrypted: encryptedCandidate, updated_at: now })
      .eq("id", 1)
      .is("totp_secret_encrypted", null)
      .select("*")
      .maybeSingle();
    assertDatabaseResult(updateError, "aggiornamento impostazioni TOTP");

    if (updated?.totp_secret_encrypted) {
      return {
        secret: candidateSecret,
        enabled: updated.totp_enabled,
        lastTimeStep: updated.last_totp_time_step,
      };
    }

    const retry = await db
      .from("admin_settings")
      .select("*")
      .eq("id", 1)
      .single();
    assertDatabaseResult(retry.error, "rilettura impostazioni TOTP");
    existing = retry.data;
  }

  if (!existing?.totp_secret_encrypted) {
    throw new DatabaseOperationError("configurazione TOTP non disponibile");
  }

  return {
    secret: decryptAdminSecret(existing.totp_secret_encrypted),
    enabled: existing.totp_enabled,
    lastTimeStep: existing.last_totp_time_step,
  };
}

export async function totpQrDataUrl(secret: string) {
  const uri = generateURI({
    issuer: "Voicyy",
    label: process.env.ADMIN_TOTP_LABEL?.trim() || "info.voicyy@gmail.com",
    secret,
  });
  return QRCode.toDataURL(uri, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 280,
  });
}

export async function verifyTotpCode(
  secret: string,
  code: string,
  afterTimeStep: number | null,
) {
  const result = await verify({
    secret,
    token: code,
    epochTolerance: 30,
    ...(afterTimeStep === null ? {} : { afterTimeStep }),
  });
  return result.valid && "timeStep" in result ? result.timeStep : null;
}

export async function consumeTotpTimeStep(timeStep: number) {
  const { data, error } = await getSupabaseAdmin().rpc(
    "consume_totp_time_step",
    { p_time_step: timeStep },
  );
  assertDatabaseResult(error, "protezione replay TOTP");
  return data === true;
}

export async function confirmTotpEnrollment() {
  const now = new Date().toISOString();
  const { error } = await getSupabaseAdmin()
    .from("admin_settings")
    .update({
      totp_enabled: true,
      totp_confirmed_at: now,
      updated_at: now,
    })
    .eq("id", 1);
  assertDatabaseResult(error, "conferma TOTP");
}
