// GET /api/resolve/captcha/auto-status — honest recognizer capability report
// (spec §19/§22: installed / healthy / enabled are SEPARATE flags; manual
// fallback always available). No secrets.

import { NextResponse } from "next/server";
import { recognizerHealth } from "@/lib/legal-search/captcha/recognizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const h = await recognizerHealth();
  return NextResponse.json({
    installed: h.installed,
    healthy: h.healthy,
    enabled: h.enabled,
    reason: h.reason ?? null,
    // automatic submit budget: one attempt per challenge generation; the
    // manual dialog is always the fallback.
    manualAlwaysAvailable: true,
  });
}
