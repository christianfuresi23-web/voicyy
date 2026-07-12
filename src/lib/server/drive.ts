import "server-only";

export type DriveSaveResult = {
  status: "saved" | "skipped" | "failed";
  fileId: string | null;
  error: string | null;
};

/**
 * Deliberate no-op until a Google service account is provisioned and the
 * destination folder is shared with it. The database remains the source of truth.
 */
export async function saveRequestToDrive(): Promise<DriveSaveResult> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()) {
    return { status: "skipped", fileId: null, error: null };
  }

  return {
    status: "skipped",
    fileId: null,
    error: "Integrazione Drive non ancora attivata nel deployment",
  };
}
