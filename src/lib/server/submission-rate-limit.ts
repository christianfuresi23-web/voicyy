import "server-only";

import { hmacFingerprint, requestClientData } from "./request-guard";
import { submissionWriteSecret } from "./supabase-write";

export class SubmissionRateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Hai inviato troppe richieste. Riprova tra un'ora.");
    this.name = "SubmissionRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Produces a pseudonymous, deployment-specific rate key. Raw IP addresses are
 * neither sent to nor stored by Supabase.
 */
export function submissionHashes(request: Request, recipientEmail: string) {
  const { ip } = requestClientData(request);
  const secret = submissionWriteSecret();
  return {
    ipHash: hmacFingerprint(ip, secret),
    recipientHash: hmacFingerprint(
      recipientEmail.trim().toLocaleLowerCase("it-IT"),
      secret,
    ),
  };
}
