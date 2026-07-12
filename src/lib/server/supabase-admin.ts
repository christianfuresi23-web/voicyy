import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./supabase-types";

export class DatabaseConfigurationError extends Error {
  constructor(message = "SUPABASE_URL o SUPABASE_SECRET_KEY non configurata") {
    super(message);
    this.name = "DatabaseConfigurationError";
  }
}

export class DatabaseOperationError extends Error {
  constructor(operation: string) {
    super(`Operazione database non riuscita: ${operation}`);
    this.name = "DatabaseOperationError";
  }
}

let adminClient: SupabaseClient<Database> | undefined;

/** Server-only and lazy so a Vercel build succeeds before env provisioning. */
export function getSupabaseAdmin() {
  if (adminClient) return adminClient;

  const url = process.env.SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secretKey) throw new DatabaseConfigurationError();

  adminClient = createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    db: { schema: "public" },
    global: { headers: { "X-Client-Info": "voicyy-server/1.0" } },
  });
  return adminClient;
}

export function assertDatabaseResult(
  error: { message: string } | null,
  operation: string,
) {
  if (error) throw new DatabaseOperationError(operation);
}
