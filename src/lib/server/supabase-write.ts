import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./supabase-types";

const MINIMUM_WRITE_SECRET_BYTES = 43;
const MAXIMUM_WRITE_SECRET_BYTES = 72;

export class DatabaseConfigurationError extends Error {
  constructor(
    message =
      "SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY o SUBMISSION_WRITE_SECRET non configurata",
  ) {
    super(message);
    this.name = "DatabaseConfigurationError";
  }
}

export class DatabaseOperationError extends Error {
  readonly operation: string;

  constructor(operation: string) {
    super(`Operazione database non riuscita: ${operation}`);
    this.name = "DatabaseOperationError";
    this.operation = operation;
  }
}

let writerClient: SupabaseClient<Database> | undefined;

/**
 * Returns the unprivileged PostgREST client used by the request endpoint.
 * The publishable key only assumes `anon`; database grants restrict it to the
 * two authenticated write-only RPC functions declared in database/schema.sql.
 */
export function getSupabaseWriter() {
  if (writerClient) return writerClient;

  const url = process.env.SUPABASE_URL?.trim();
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) throw new DatabaseConfigurationError();

  writerClient = createClient<Database>(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    db: { schema: "public" },
    global: { headers: { "X-Client-Info": "voicyy-write-ingress/1.0" } },
  });
  return writerClient;
}

/**
 * The same high-entropy value is used to authenticate each RPC and as the HMAC
 * key for the rate-limit identifier. It is never exposed to the browser.
 * 43–72 UTF-8 bytes fits a 32–48 byte base64 secret. PostgreSQL stores only
 * its SHA-256 digest; this value is never exposed to the browser.
 */
export function submissionWriteSecret() {
  const secret = process.env.SUBMISSION_WRITE_SECRET?.trim();
  const bytes = secret ? new TextEncoder().encode(secret).byteLength : 0;
  if (
    !secret ||
    bytes < MINIMUM_WRITE_SECRET_BYTES ||
    bytes > MAXIMUM_WRITE_SECRET_BYTES
  ) {
    throw new DatabaseConfigurationError(
      "SUBMISSION_WRITE_SECRET deve contenere tra 43 e 72 byte",
    );
  }
  return secret;
}

export function assertDatabaseResult(
  error: { message: string } | null,
  operation: string,
) {
  if (error) throw new DatabaseOperationError(operation);
}
