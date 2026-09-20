// OCR WORKER FIXTURE TEST (Stage G) — runs the REAL isolated Python worker
// (ddddocr) through the Node adapter against a Pillow-generated digit
// fixture. Proves the pipeline (spawn → protocol → recognition) works on
// this machine. This is LOCAL_OCR_FIXTURES_VERIFIED only — it does NOT prove
// accuracy against the live Datalex challenge (AUTO_CAPTCHA_LIVE separate).
//
// The fixture candidate must contain the digits "1234" (exact-string assert
// on a clean synthetic render; real-world accuracy is measured separately
// per §20 and is NOT claimed here).

import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";
import { recognizeImage, recognizerHealth } from "../../src/lib/legal-search/captcha/recognizer";

const venvReady =
  existsSync(path.join(process.cwd(), "captcha-recognizer", "venv", "Scripts", "python.exe")) &&
  existsSync(path.join(process.cwd(), "captcha-recognizer", "worker.py"));

describe("local OCR worker (ddddocr) — fixture verification", () => {
  test("worker is installed in the isolated venv", () => {
    expect(venvReady).toBe(true);
  });

  test("recognizer health reports installed+healthy", async () => {
    const h = await recognizerHealth();
    expect(h.installed).toBe(true);
    expect(h.healthy).toBe(true);
  });

  test("fixture round-trip: synthetic digit image → candidate containing 1234", async () => {
    // Generate the same fixture the worker selftest uses (Pillow, server-side
    // of the venv) — done via a tiny worker call: send a Pillow-rendered PNG
    // produced by the venv python through the adapter protocol.
    const { spawnSync } = await import("node:child_process");
    const venvPython = path.join(process.cwd(), "captcha-recognizer", "venv", "Scripts", "python.exe");
    const gen = spawnSync(
      venvPython,
      ["-c",
        "import io,base64;from PIL import Image,ImageDraw,ImageFont;" +
        "img=Image.new('RGB',(160,48),(245,245,245));d=ImageDraw.Draw(img);" +
        "f=ImageFont.load_default(28) if 'size' in ImageFont.load_default.__doc__ or True else ImageFont.load_default();" +
        "d.text((12,8),'1234',fill=(20,20,20),font=f);b=io.BytesIO();img.save(b,'PNG');" +
        "print(base64.b64encode(b.getvalue()).decode())"],
      { encoding: "utf8", timeout: 30_000 },
    );
    expect(gen.status).toBe(0);
    const b64 = gen.stdout.trim().split("\n").pop()!;
    expect(b64.length).toBeGreaterThan(100);

    const result = await recognizeImage(Buffer.from(b64, "base64"));
    expect(result.kind).toBe("candidate");
    expect((result.text ?? "").replace(/[^0-9]/g, "")).toContain("1234");
  });

  test("garbage input returns bounded failure (no hang, no crash)", async () => {
    const result = await recognizeImage(Buffer.from("not-an-image"));
    // ddddocr may throw on garbage or return empty → either manual-required
    // or unavailable, but the adapter must answer within its timeout budget.
    expect(["manual-required", "unavailable", "candidate"]).toContain(result.kind);
  });
});
