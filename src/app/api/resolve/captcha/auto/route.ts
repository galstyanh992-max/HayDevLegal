// POST /api/resolve/captcha/auto — ONE bounded automatic recognition attempt
// (Stage G). Opt-in via DATALEX_AUTO_CAPTCHA=true; the manual dialog always
// remains available. Budget: this endpoint consumes one resume-token attempt
// (max 5 per token, shared with manual attempts — no brute-force loop).
//
// Flow: validate token/session → fetch the challenge image server-side (same
// guarded path as the image proxy, 256 KiB cap) → local recognizer → submit
// the candidate ONCE through the standard resolve path → manual-fallback
// status on any failure (no retry loop, no confidence invention).

import { NextRequest, NextResponse } from "next/server";
import { getResumeToken, dropResumeToken } from "@/lib/legal-search/engine/resume-store";
import { datalexCaptchaImageUrl, datalexShowCase } from "@/lib/legal-search/sources/datalex/client";
import { getSession } from "@/lib/legal-search/sources/session-store";
import { fetchGuarded } from "@/lib/legal-search/security/url-policy";
import { extractMainText } from "@/lib/legal-search/security/content-sanitizer";
import { POLICY, TIMEOUTS } from "@/lib/legal-search/config";
import { recognizeImage, isAutoEnabled } from "@/lib/legal-search/captcha/recognizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 256 * 1024;
const SESSION_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  if (!isAutoEnabled()) {
    return NextResponse.json(
      { status: "auto_disabled", error: "AUTO_DISABLED", manual: true },
      { status: 409 },
    );
  }

  const body = (await req.json().catch(() => null)) as
    | { token?: unknown; sessionId?: unknown }
    | null;
  const token = typeof body?.token === "string" ? body.token : "";
  const t = getResumeToken(token);
  if (!t) {
    return NextResponse.json({ status: "expired", error: "SESSION_EXPIRED", manual: true }, { status: 410 });
  }

  const sessionIdRaw = typeof body?.sessionId === "string" ? body.sessionId : "";
  const sessionId = sessionIdRaw && SESSION_ID_RE.test(sessionIdRaw) ? sessionIdRaw : "";
  const storedSession = sessionId ? getSession("datalex", "USER_SESSION", sessionId) : undefined;
  const cookies = storedSession?.cookies ?? t.cookies;

  try {
    // 1) Fetch the challenge image (same guarded path as the manual proxy).
    const imgRes = await fetchGuarded(datalexCaptchaImageUrl(), {
      timeoutMs: 8_000,
      headers: {
        "User-Agent": POLICY.userAgent,
        Accept: "image/*",
        Cookie: cookies,
        Referer: "https://datalex.am/?app=AppCaseSearch",
      },
    });
    if (!imgRes.ok) {
      return NextResponse.json({ status: "source_unavailable", error: "IMAGE_UNAVAILABLE", manual: true }, { status: 502 });
    }
    const buf = new Uint8Array(await imgRes.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ status: "source_unavailable", error: "IMAGE_SIZE", manual: true }, { status: 502 });
    }

    // 2) Local recognition — one shot.
    const rec = await recognizeImage(buf);
    if (rec.kind !== "candidate" || !rec.text || !/^[A-Za-z0-9]{3,10}$/.test(rec.text)) {
      return NextResponse.json({
        status: "manual_required",
        error: rec.reason ?? "AUTO_NO_CANDIDATE",
        manual: true,
      });
    }

    // 3) ONE submit attempt (consumes a token attempt — shared budget).
    if (++t.attempts > 5) {
      return NextResponse.json({ status: "expired", error: "TOO_MANY_ATTEMPTS", manual: true }, { status: 429 });
    }
    const res = await datalexShowCase({
      caseExternalId: t.caseExternalId,
      appName: t.appName,
      captchaText: rec.text,
      cookies,
      timeoutMs: TIMEOUTS.documentMs,
      sessionId,
    });

    if (res.kind === "captcha_required") {
      return NextResponse.json({ status: "captcha_required", error: "AUTO_SOLUTION_REJECTED", manual: true });
    }
    if (res.kind !== "full_text") {
      return NextResponse.json({
        status: "error",
        error: res.kind === "not_found" ? "CASE_NOT_FOUND" : "SOURCE_ERROR",
        manual: true,
      });
    }

    dropResumeToken(token);
    return NextResponse.json({
      status: "resolved",
      url: t.canonicalUrl,
      sessionId,
      textPreview: extractMainText(res.html, { maxChars: 120_000 }).slice(0, 1500),
      auto: true,
      manual: true,
    });
  } catch {
    return NextResponse.json({ status: "source_unavailable", error: "NETWORK", manual: true }, { status: 502 });
  }
}
