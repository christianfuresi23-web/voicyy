import { NextResponse } from "next/server";

import {
  clearAdminCookies,
  revokeCurrentAdminSession,
} from "@/lib/server/admin-session";
import { assertSameOrigin, RequestGuardError } from "@/lib/server/request-guard";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    if (error instanceof RequestGuardError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await revokeCurrentAdminSession();
  } catch {
    // Always clear the browser cookies, even if the database is temporarily
    // unavailable. Server-side sessions remain short lived.
  }

  const response = NextResponse.redirect(
    new URL("/voicyy-admin-x9k2", request.url),
    303,
  );
  clearAdminCookies(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
