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
  assertSubmissionRateLimit,
  RequestSecurityConfigurationError,
  submissionHashes,
  SubmissionRateLimitError,
} from "@/lib/server/submission-rate-limit";
import {
  assertDatabaseResult,
  DatabaseConfigurationError,
  DatabaseOperationError,
  getSupabaseAdmin,
} from "@/lib/server/supabase-admin";
import { agentRequestSchema } from "@/lib/validation/agent-request";

export const runtime = "nodejs";

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

function referenceCode() {
  return `VY-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
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

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);

    // Honeypot: appear successful without storing or sending anything.
    if (
      body &&
      typeof body === "object" &&
      "companyWebsite" in body &&
      typeof body.companyWebsite === "string" &&
      body.companyWebsite.trim() !== ""
    ) {
      return json({ ok: true, referenceCode: referenceCode() }, { status: 202 });
    }

    const parsed = agentRequestSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        {
          ok: false,
          error: "Controlla i campi evidenziati e riprova.",
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
    const db = getSupabaseAdmin();

    // A retry with the same client-generated UUID returns the durable result
    // without creating a second row or sending duplicate emails.
    const existing = await db
      .from("agent_requests")
      .select("reference_code, client_email_status")
      .eq("submission_id", input.submissionId)
      .maybeSingle();
    assertDatabaseResult(existing.error, "verifica invio duplicato");
    if (existing.data) {
      return receivedResponse(
        existing.data.reference_code,
        existing.data.client_email_status === "accepted",
        200,
      );
    }

    const reference = referenceCode();
    const now = new Date();
    const hashes = submissionHashes(request);
    await assertSubmissionRateLimit(hashes.ipHash);

    const { data: stored, error: insertError } = await db
      .from("agent_requests")
      .insert({
        submission_id: input.submissionId,
        reference_code: reference,
        contact_name: input.contactName,
        business_name: input.businessName,
        contact_email: input.contactEmail,
        notification_email: input.notificationEmail,
        phone: input.phone,
        website: input.website ?? null,
        details: input.details,
        services: input.services,
        working_days: input.workingDays,
        schedule: input.schedule,
        hours_per_day: input.hoursPerDay,
        calendar_email: input.calendarEmail,
        drive_folder_id: input.driveFolderId ?? null,
        llm: input.configuration.llm,
        text_to_speech: input.configuration.textToSpeech,
        telephony: input.configuration.telephony,
        monthly_minutes: input.configuration.minutes,
        estimated_monthly_price: price,
        configuration: {
          llm: input.configuration.llm,
          textToSpeech: input.configuration.textToSpeech,
          telephony: input.configuration.telephony,
          minutes: input.configuration.minutes,
          estimatedMonthlyPrice: price,
        },
        terms_accepted: true,
        terms_version: "2025-06",
        privacy_version: "2025-06",
        marketing_consent: input.marketingConsent,
        marketing_consent_version: input.marketingConsent ? "2025-06" : null,
        marketing_consented_at: input.marketingConsent ? now.toISOString() : null,
        consented_at: now.toISOString(),
      })
      .select("id")
      .single();
    if (insertError?.code === "23505") {
      const duplicate = await db
        .from("agent_requests")
        .select("reference_code, client_email_status")
        .eq("submission_id", input.submissionId)
        .maybeSingle();
      assertDatabaseResult(duplicate.error, "recupero invio duplicato");
      if (duplicate.data) {
        return receivedResponse(
          duplicate.data.reference_code,
          duplicate.data.client_email_status === "accepted",
          200,
        );
      }
    }
    assertDatabaseResult(insertError, "salvataggio richiesta");
    if (!stored) throw new DatabaseOperationError("salvataggio richiesta");

    const emailContext = {
      referenceCode: reference,
      request: input,
      estimatedMonthlyPrice: price,
    };

    // Each side effect resolves independently: one provider failure never hides
    // the stored request or prevents the other email from being attempted.
    const [adminEmail, clientEmail, drive] = await Promise.all([
      sendAdminNotification(emailContext),
      sendClientConfirmation(emailContext),
      saveRequestToDrive(),
    ]);

    try {
      const { error: updateError } = await db
        .from("agent_requests")
        .update({
          admin_email_status: adminEmail.status,
          admin_email_id: adminEmail.id,
          admin_email_error: adminEmail.error,
          admin_email_attempted_at: adminEmail.attemptedAt.toISOString(),
          admin_email_accepted_at: adminEmail.acceptedAt?.toISOString() ?? null,
          client_email_status: clientEmail.status,
          client_email_id: clientEmail.id,
          client_email_error: clientEmail.error,
          client_email_attempted_at: clientEmail.attemptedAt.toISOString(),
          client_email_accepted_at: clientEmail.acceptedAt?.toISOString() ?? null,
          drive_status: drive.status,
          drive_file_id: drive.fileId,
          drive_error: drive.error,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stored.id);
      assertDatabaseResult(updateError, "aggiornamento stato richiesta");
    } catch {
      // The request itself is already durable. Do not ask the user to resubmit
      // (which could create a duplicate) solely because status metadata failed.
    }

    return receivedResponse(reference, clientEmail.status === "accepted");
  } catch (error) {
    if (error instanceof RequestGuardError) {
      return json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof DatabaseConfigurationError) {
      return json(
        {
          ok: false,
          error:
            "Il servizio richieste non è ancora configurato: SUPABASE_URL o SUPABASE_SECRET_KEY mancante.",
        },
        { status: 503 },
      );
    }
    if (error instanceof RequestSecurityConfigurationError) {
      return json(
        { ok: false, error: "Protezione anti-abuso non configurata." },
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
