import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import {
  assertDatabaseResult,
  getSupabaseAdmin,
} from "@/lib/server/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const supplied = request.headers.get("authorization");
  if (!secret || !supplied) return false;

  const expectedBuffer = Buffer.from(`Bearer ${secret}`, "utf8");
  const suppliedBuffer = Buffer.from(supplied, "utf8");
  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Non autorizzato" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const { data, error } = await getSupabaseAdmin().rpc(
      "enforce_data_retention",
      {},
    );
    assertDatabaseResult(error, "applicazione retention dati");
    return NextResponse.json(
      { ok: true, result: data?.[0] ?? null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Retention non completata" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
