// DATALEX — captcha replay helpers (Stage F, findings C/D minimal fix).
//
// Priority contract: a FRESH user-submitted answer always wins over a stored
// replay key. The stored key is only used when the user typed nothing
// ("solve once, view many" replay path). When the source rejects a stored
// key, clearStoredCaptchaKey() invalidates it (keeping the session cookies,
// which may still be valid) so the stale value can never override fresh
// input on a retry.

import { updateSession } from "../session-store";

export function resolveSubmitCaptcha(replayKey: string, captchaText: string): string {
  return captchaText || replayKey;
}

export function clearStoredCaptchaKey(sessionId: string): void {
  if (!sessionId) return;
  updateSession(
    "datalex",
    { captchaKey: undefined, captchaKeyAt: undefined },
    "USER_SESSION",
    sessionId,
  );
}
