import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { calculateMonthlyPrice } from "@/data/pricing";
import { saveRequestToDrive } from "@/lib/server/drive";
import {
  sendAdminNotification,
  sendClientConfirmation,
} from "@/lib/server/email";
import {
  readJsonBody,
  RequestGuardError,
} from "@/lib/server/request-guard";
import {
  DataEncryptionConfigurationError,
  encryptRequestPayload,
} from "@/lib/server/request-encryption";
import {
  submissionHashes,
  SubmissionRateLimitError,
} from "@/lib/server/submission-rate-limit";
import {
  assertDatabaseResult,
  DatabaseConfigurationError,
  DatabaseOperationError,
  getSupabaseWriter,
  submissionWriteSecret,
} from "@/lib/server/supabase-write";
import type { Json } from "@/lib/server/supabase-types";
import { agentRequestSchema } from "@/lib/validation/agent-request";

export const runtime = "nodejs";

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

function decoyReferenceCode() {
  return `VY-${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
}

function receivedResponse(
  reference: string,
  confirmationEmailAccepted: boolean,
  status = 201,
) {
  return json(
    {
      ok: true,
      referenceCode: reference,
      confirmationEmailAccepted,
      message: confirmationEmailAccepted
        ? `Richiesta ricevuta. Il provider email ha preso in carico la conferma. Codice richiesta: ${reference}.`
        : `Richiesta ricevuta. Se la conferma email non arriva, conserva il codice ${reference}.`,
    },
    { status },
  );
}

function deliveryPayload(
  adminEmail: Awaited<ReturnType<typeof sendAdminNotification>>,
  clientEmail: Awaited<ReturnType<typeof sendClientConfirmation>>,
  drive: Awaited<ReturnType<typeof saveRequestToDrive>>,
): Json {
  return {
    owner: {
      status: adminEmail.status,
      attemptedAt: adminEmail.attemptedAt.toISOString(),
      acceptedAt: adminEmail.acceptedAt?.toISOString() ?? null,
    },
    client: {
      status: clientEmail.status,
      attemptedAt: clientEmail.attemptedAt.toISOString(),
      acceptedAt: clientEmail.acceptedAt?.toISOString() ?? null,
    },
    drive: {
      status: drive.status,
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);

    // Honeypot: appear successful without storing or sending anything.
    if (
      body &&
      typeof body === "object" &&
      "botField" in body &&
      typeof body.botField === "string" &&
      body.botField.trim() !== ""
    ) {
      return json(
        { ok: true, referenceCode: decoyReferenceCode() },
        { status: 202 },
      );
    }

    const parsed = agentRequestSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        {
          ok: false,
          error: "Controlla i dati indicati e riprova.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const input = parsed.data;
    const price = calculateMonthlyPrice({
      llm: input.configuration.llm,
      textToSpeech: input.configuration.textToSpeech,
      telephony: input.configuration.telephony,
      minutes: input.configuration.minutes,
    });
    const writeSecret = submissionWriteSecret();
    const hashes = submissionHashes(request, input.contactEmail);
    const encrypted = encryptRequestPayload(
      {
        ...input,
        estimatedMonthlyPrice: price,
      } as Json,
      input.submissionId,
    );
    const db = getSupabaseWriter();

    // This is the only operation capable of creating a request. The database
    // function authenticates the second secret, applies an atomic rate limit,
    // serializes retries and returns only reference/delivery metadata (no PII).
    const ingress = await db.rpc("submit_agent_request", {
      p_write_secret: writeSecret,
      p_submission_id: input.submissionId,
      p_ip_key_hash: hashes.ipHash,
      p_recipient_key_hash: hashes.recipientHash,
      p_payload_ciphertext: encrypted.payloadCiphertext,
      p_payload_iv: encrypted.payloadIv,
      p_payload_auth_tag: encrypted.payloadAuthTag,
      p_encryption_version: encrypted.encryptionVersion,
      p_terms_accepted: input.termsAccepted,
      p_marketing_consent: input.marketingConsent,
    });
    assertDatabaseResult(ingress.error, "salvataggio richiesta");

    const stored = ingress.data?.[0];
    if (!stored) throw new DatabaseOperationError("salvataggio richiesta");
    if (!stored.accepted) {
      throw new SubmissionRateLimitError(
        Math.max(1, stored.retry_after_seconds),
      );
    }
    if (!stored.reference_code) {
      throw new DatabaseOperationError("ricezione codice richiesta");
    }

    const reference = stored.reference_code;

    const emailContext = {
      referenceCode: reference,
      request: input,
      estimatedMonthlyPrice: price,
    };

    // Each side effect resolves independently: one provider failure never hides
    // the durable request or prevents the other email from being attempted.
    const [adminEmail, clientEmail, drive] = await Promise.all([
      sendAdminNotification(emailContext),
      sendClientConfirmation(emailContext),
      saveRequestToDrive(),
    ]);

    try {
      const delivery = await db.rpc("update_agent_request_delivery", {
        p_write_secret: writeSecret,
        p_submission_id: input.submissionId,
        p_reference_code: reference,
        p_delivery: deliveryPayload(adminEmail, clientEmail, drive),
      });
      assertDatabaseResult(delivery.error, "aggiornamento stato richiesta");
      if (!delivery.data) {
        throw new DatabaseOperationError("aggiornamento stato richiesta");
      }
    } catch {
      // The request is already durable. Never ask the user to resubmit merely
      // because delivery metadata could not be updated.
    }

    return receivedResponse(
      reference,
      clientEmail.status === "accepted",
      stored.inserted ? 201 : 200,
    );
  } catch (error) {
    if (error instanceof RequestGuardError) {
      return json({ ok: false, error: error.message }, { status: error.status });
    }
    if (
      error instanceof DatabaseConfigurationError ||
      error instanceof DataEncryptionConfigurationError
    ) {
      return json(
        {
          ok: false,
          error:
            "Il servizio richieste non è ancora configurato: verifica SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUBMISSION_WRITE_SECRET e REQUEST_DATA_ENCRYPTION_KEY.",
        },
        { status: 503 },
      );
    }
    if (error instanceof SubmissionRateLimitError) {
      const response = json(
        { ok: false, error: error.message },
        { status: 429 },
      );
      response.headers.set("Retry-After", String(error.retryAfterSeconds));
      return response;
    }

    return json(
      {
        ok: false,
        error: "Non è stato possibile salvare la richiesta. Riprova tra poco.",
      },
      { status: 500 },
    );
  }
}
