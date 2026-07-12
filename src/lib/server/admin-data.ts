import "server-only";

import { hasValidAdminSession } from "./admin-session";
import { assertDatabaseResult, getSupabaseAdmin } from "./supabase-admin";

export class AdminUnauthorizedError extends Error {
  constructor() {
    super("Sessione amministratore non valida");
    this.name = "AdminUnauthorizedError";
  }
}

const dashboardColumns = `
  id,
  reference_code,
  status,
  contact_name,
  business_name,
  contact_email,
  notification_email,
  phone,
  website,
  details,
  services,
  working_days,
  schedule,
  hours_per_day,
  calendar_email,
  drive_folder_id,
  llm,
  text_to_speech,
  telephony,
  monthly_minutes,
  estimated_monthly_price,
  terms_accepted,
  terms_version,
  privacy_version,
  marketing_consent,
  marketing_consent_version,
  marketing_consented_at,
  consented_at,
  admin_email_status,
  admin_email_error,
  admin_email_accepted_at,
  client_email_status,
  client_email_error,
  client_email_accepted_at,
  drive_status,
  drive_error,
  created_at,
  updated_at
` as const;

export async function listAgentRequestsForAdmin() {
  // This check deliberately lives beside the query. UI routing is not an
  // authorization boundary and must never be the only gate to personal data.
  if (!(await hasValidAdminSession())) throw new AdminUnauthorizedError();

  const { data, error } = await getSupabaseAdmin()
    .from("agent_requests")
    .select(dashboardColumns)
    .order("created_at", { ascending: false })
    .limit(100);
  assertDatabaseResult(error, "lettura richieste amministratore");
  return data ?? [];
}
