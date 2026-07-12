import { adminApiError, adminJson } from "@/lib/server/admin-api";
import { adminRequestFingerprint } from "@/lib/server/admin-rate-limit";
import {
  hasValidAdminSession,
  readFlowToken,
} from "@/lib/server/admin-session";
import { ensureTotpState, totpQrDataUrl } from "@/lib/server/admin-totp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (await hasValidAdminSession()) {
      return adminJson({ ok: true, next: "dashboard" });
    }

    const fingerprint = adminRequestFingerprint(request);
    const flow = await readFlowToken(fingerprint.fingerprintHash);
    if (flow?.step === "phrase") {
      return adminJson({ ok: true, next: "phrase" });
    }
    if (flow?.step === "totp") {
      const totp = await ensureTotpState();
      return adminJson({
        ok: true,
        next: "totp",
        enrollment: !totp.enabled,
        qrDataUrl: totp.enabled ? undefined : await totpQrDataUrl(totp.secret),
      });
    }
    return adminJson({ ok: true, next: "password" });
  } catch (error) {
    return adminApiError(error);
  }
}
