// DATALEX SESSION CORRECTNESS — regression tests for master-task §14
// findings C and D (Galstyan redesign, Stage F).
//
// C: updateSession() create-branch — a session CREATED with an accepted
//    captchaKey must carry captchaKeyAt, otherwise the next getSession/
//    refreshCaptchaKey sees a timestampless key and may drop the freshly
//    accepted answer (finding C in the master prompt).
//
// D: stale replay key handling — fresh user input must win over the stored
//    key, and a source-rejected stored key must be invalidated so it can
//    never again override fresh input ("старый ключ отвергнут → свежий ввод
//    принят").

import { describe, expect, test } from "bun:test";
import {
  updateSession,
  getSession,
  clearSession,
} from "../../src/lib/legal-search/sources/session-store";
import {
  resolveSubmitCaptcha,
  clearStoredCaptchaKey,
} from "../../src/lib/legal-search/sources/datalex/captcha-replay";

const SCOPE = "USER_SESSION" as const;

describe("finding C — accepted captchaKey on session creation", () => {
  test("create-branch stamps captchaKeyAt when an accepted key is stored", () => {
    clearSession("datalex", SCOPE, "owner-C1");
    const created = updateSession(
      "datalex",
      { cookies: "PHPSESSID=abc", captchaKey: "K1" },
      SCOPE,
      "owner-C1",
    );
    expect(created?.captchaKey).toBe("K1");
    expect(created?.captchaKeyAt).toBeDefined();

    // The session read back later must still carry the timestamp.
    const again = getSession("datalex", SCOPE, "owner-C1");
    expect(again?.captchaKey).toBe("K1");
    expect(again?.captchaKeyAt).toBeDefined();
    clearSession("datalex", SCOPE, "owner-C1");
  });

  test("update-branch keeps stamping captchaKeyAt (existing behavior)", () => {
    clearSession("datalex", SCOPE, "owner-C2");
    updateSession("datalex", { cookies: "PHPSESSID=abc" }, SCOPE, "owner-C2");
    const updated = updateSession("datalex", { captchaKey: "K2" }, SCOPE, "owner-C2");
    expect(updated?.captchaKeyAt).toBeDefined();
    clearSession("datalex", SCOPE, "owner-C2");
  });
});

describe("finding D — stale replay key vs fresh user input", () => {
  test("fresh user input wins over the stored replay key", () => {
    expect(resolveSubmitCaptcha("OLDKEY", "fresh7")).toBe("fresh7");
  });

  test("replay path still works when the user typed nothing", () => {
    expect(resolveSubmitCaptcha("OLDKEY", "")).toBe("OLDKEY");
  });

  test("invalidation drops the stored key but keeps session cookies", () => {
    clearSession("datalex", SCOPE, "owner-D1");
    updateSession(
      "datalex",
      { cookies: "PHPSESSID=keepme", captchaKey: "STALE1" },
      SCOPE,
      "owner-D1",
    );

    // Source rejected the stored key → invalidate it.
    clearStoredCaptchaKey("owner-D1");

    const after = getSession("datalex", SCOPE, "owner-D1");
    expect(after?.captchaKey ?? "").toBe(""); // key gone
    expect(after?.captchaKeyAt ?? 0).toBe(0); // timestamp gone too
    expect(after?.cookies).toContain("PHPSESSID=keepme"); // cookies preserved
    clearSession("datalex", SCOPE, "owner-D1");
  });

  test("invalidation with no session is a safe no-op", () => {
    clearSession("datalex", SCOPE, "owner-D2");
    expect(() => clearStoredCaptchaKey("owner-D2")).not.toThrow();
    expect(getSession("datalex", SCOPE, "owner-D2")).toBeUndefined();
  });
});
