import { compare } from "bcryptjs";

import { adminApiError, adminJson } from "@/lib/server/admin-api";
import { adminPasswordHash } from "@/lib/server/admin-config";
import {
  adminRequestFingerprint,
  assertAdminRateLimit,
  recordAdminAttempt,
} from "@/lib/server/admin-rate-limit";
import { createFlowToken, setFlowCookie } from "@/lib/server/admin-session";
import { ensureTotpState, totpQrDataUrl } from "@/lib/server/admin-totp";
import { readJsonBody } from "@/lib/server/request-guard";
import { adminPasswordSchema } from "@/lib/validation/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = adminPasswordSchema.parse(await readJsonBody(request, 4 * 1024));
    const fingerprint = adminRequestFingerprint(request);
    await assertAdminRateLimit(fingerprint.ipHash);

    const valid = await compare(body.password, adminPasswordHash());
    if (!valid) {
      await recordAdminAttempt(request, "password", false, "invalid_credentials");
      return adminJson(
        { ok: false, error: "Credenziali non valide" },
        { status: 401 },
      );
    }

    const totp = await ensureTotpState();
    const qrDataUrl = totp.enabled ? undefined : await totpQrDataUrl(totp.secret);
    const flowToken = await createFlowToken(
      "totp",
      fingerprint.fingerprintHash,
    );
    await recordAdminAttempt(request, "password", true);

    const response = adminJson({
      ok: true,
      next: "totp",
      enrollment: !totp.enabled,
      qrDataUrl,
    });
    setFlowCookie(response, flowToken);
    return response;
  } catch (error) {
    return adminApiError(error);
  }
}
