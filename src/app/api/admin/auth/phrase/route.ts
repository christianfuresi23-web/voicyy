import { compare } from "bcryptjs";

import { adminApiError, adminJson } from "@/lib/server/admin-api";
import { adminRecoveryPhraseHash } from "@/lib/server/admin-config";
import { recoveryPhraseDigest } from "@/lib/server/admin-crypto";
import {
  adminRequestFingerprint,
  assertAdminRateLimit,
  recordAdminAttempt,
} from "@/lib/server/admin-rate-limit";
import {
  clearFlowCookie,
  consumeFlowToken,
  createAdminSessionToken,
  readFlowToken,
  setAdminSessionCookie,
} from "@/lib/server/admin-session";
import { readJsonBody } from "@/lib/server/request-guard";
import {
  adminPhraseSchema,
  normalizeRecoveryPhrase,
} from "@/lib/validation/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = adminPhraseSchema.parse(await readJsonBody(request, 4 * 1024));
    const fingerprint = adminRequestFingerprint(request);
    await assertAdminRateLimit(fingerprint.ipHash);

    const flow = await readFlowToken(fingerprint.fingerprintHash);
    if (flow?.step !== "phrase") {
      await recordAdminAttempt(request, "phrase", false, "invalid_flow");
      return adminJson(
        { ok: false, error: "Sessione di accesso scaduta. Riparti dalla password." },
        { status: 401 },
      );
    }

    const normalized = normalizeRecoveryPhrase(body.phrase);
    const valid =
      normalized.split(" ").length === 12 &&
      (await compare(
        recoveryPhraseDigest(normalized),
        adminRecoveryPhraseHash(),
      ));
    if (!valid) {
      await recordAdminAttempt(request, "phrase", false, "invalid_phrase");
      return adminJson(
        { ok: false, error: "Frase di sicurezza non valida" },
        { status: 401 },
      );
    }

    if (!(await consumeFlowToken(flow))) {
      await recordAdminAttempt(request, "phrase", false, "replayed_flow");
      return adminJson(
        { ok: false, error: "Sessione di accesso già utilizzata. Riparti dalla password." },
        { status: 401 },
      );
    }

    const sessionToken = await createAdminSessionToken();
    await recordAdminAttempt(request, "phrase", true);
    const response = adminJson({ ok: true, next: "dashboard" });
    setAdminSessionCookie(response, sessionToken);
    clearFlowCookie(response);
    return response;
  } catch (error) {
    return adminApiError(error);
  }
}
