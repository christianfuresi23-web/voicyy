import { adminApiError, adminJson } from "@/lib/server/admin-api";
import {
  adminRequestFingerprint,
  assertAdminRateLimit,
  recordAdminAttempt,
} from "@/lib/server/admin-rate-limit";
import {
  consumeFlowToken,
  createFlowToken,
  readFlowToken,
  setFlowCookie,
} from "@/lib/server/admin-session";
import {
  confirmTotpEnrollment,
  consumeTotpTimeStep,
  ensureTotpState,
  verifyTotpCode,
} from "@/lib/server/admin-totp";
import { readJsonBody } from "@/lib/server/request-guard";
import { adminTotpSchema } from "@/lib/validation/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = adminTotpSchema.parse(await readJsonBody(request, 4 * 1024));
    const fingerprint = adminRequestFingerprint(request);
    await assertAdminRateLimit(fingerprint.ipHash);

    const flow = await readFlowToken(fingerprint.fingerprintHash);
    if (flow?.step !== "totp") {
      await recordAdminAttempt(request, "totp", false, "invalid_flow");
      return adminJson(
        { ok: false, error: "Sessione di accesso scaduta. Riparti dalla password." },
        { status: 401 },
      );
    }

    const totp = await ensureTotpState();
    const timeStep = await verifyTotpCode(
      totp.secret,
      body.code,
      totp.lastTimeStep,
    );
    if (timeStep === null || !(await consumeTotpTimeStep(timeStep))) {
      await recordAdminAttempt(request, "totp", false, "invalid_code");
      return adminJson(
        { ok: false, error: "Codice di verifica non valido" },
        { status: 401 },
      );
    }

    if (!(await consumeFlowToken(flow))) {
      await recordAdminAttempt(request, "totp", false, "replayed_flow");
      return adminJson(
        { ok: false, error: "Sessione di accesso già utilizzata. Riparti dalla password." },
        { status: 401 },
      );
    }

    if (!totp.enabled) await confirmTotpEnrollment();

    const token = await createFlowToken("phrase", fingerprint.fingerprintHash);
    await recordAdminAttempt(request, "totp", true);
    const response = adminJson({ ok: true, next: "phrase" });
    setFlowCookie(response, token);
    return response;
  } catch (error) {
    return adminApiError(error);
  }
}
