// DATALEX — local OCR recognizer adapter (Stage G).
//
// Manages the isolated Python worker (captcha-recognizer/venv + worker.py)
// as a persistent subprocess with a line-delimited JSON protocol. The
// adapter never sends cookies/URLs/case data — only bounded image bytes.
//
// States (honest, spec §19/§22):
//   installed — venv python + worker.py exist on disk
//   healthy   — worker process is alive and reported {"event":"ready"}
//   enabled   — DATALEX_AUTO_CAPTCHA=true (opt-in; manual always available)

import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const RECOGNIZE_TIMEOUT_MS = 10_000;
const WORKER_DIR = path.join(process.cwd(), "captcha-recognizer");
const PYTHON = path.join(WORKER_DIR, "venv", "Scripts", "python.exe");
const WORKER = path.join(WORKER_DIR, "worker.py");

export interface RecognizerHealth {
  installed: boolean;
  healthy: boolean;
  enabled: boolean;
  reason?: string;
}

export interface RecognizeResult {
  kind: "candidate" | "manual-required" | "unavailable";
  text?: string;
  reason?: string;
}

interface Pending {
  resolve: (r: RecognizeResult) => void;
  timer: ReturnType<typeof setTimeout>;
}

let worker: ChildProcess | null = null;
let ready = false;
let starting = false;
let startError: string | undefined;
const pending = new Map<string, Pending>();

export function isAutoEnabled(): boolean {
  return process.env.DATALEX_AUTO_CAPTCHA === "true";
}

export function isInstalled(): boolean {
  return existsSync(PYTHON) && existsSync(WORKER);
}

function killWorker(): void {
  if (worker) {
    try {
      worker.kill();
    } catch {
      /* already dead */
    }
  }
  worker = null;
  ready = false;
  for (const [, p] of pending) {
    clearTimeout(p.timer);
    p.resolve({ kind: "unavailable", reason: "worker restarted" });
  }
  pending.clear();
}

function startWorker(): Promise<boolean> {
  if (ready) return Promise.resolve(true);
  if (starting) return Promise.resolve(false);
  if (!isInstalled()) {
    startError = "venv/worker not installed";
    return Promise.resolve(false);
  }
  starting = true;
  startError = undefined;

  return new Promise<boolean>((resolve) => {
    const child = spawn(PYTHON, [WORKER], {
      cwd: WORKER_DIR,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    worker = child;

    const startupTimeout = setTimeout(() => {
      startError = "worker startup timeout";
      starting = false;
      killWorker();
      resolve(false);
    }, 30_000);

    let buf = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      buf += chunk.toString("utf8");
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        let evt: { event?: string; id?: string; kind?: string; text?: string; reason?: string };
        try {
          evt = JSON.parse(line);
        } catch {
          continue; // malformed line — ignore
        }
        if (evt.event === "ready") {
          clearTimeout(startupTimeout);
          ready = true;
          starting = false;
          resolve(true);
          continue;
        }
        if (evt.event === "fatal") {
          clearTimeout(startupTimeout);
          startError = evt.reason ?? "worker fatal";
          starting = false;
          killWorker();
          resolve(false);
          continue;
        }
        const p = evt.id ? pending.get(evt.id) : undefined;
        if (p) {
          pending.delete(evt.id!);
          clearTimeout(p.timer);
          if (evt.kind === "candidate" && evt.text) {
            p.resolve({ kind: "candidate", text: evt.text });
          } else if (evt.kind === "manual-required") {
            p.resolve({ kind: "manual-required", reason: evt.reason });
          } else {
            p.resolve({ kind: "unavailable", reason: evt.reason ?? "unknown" });
          }
        }
      }
    });

    child.stderr?.on("data", () => {
      /* diagnostics only — never logged with payload */
    });

    child.on("close", () => {
      if (worker === child) {
        ready = false;
        worker = null;
        starting = false;
        for (const [, p] of pending) {
          clearTimeout(p.timer);
          p.resolve({ kind: "unavailable", reason: "worker exited" });
        }
        pending.clear();
      }
    });
  });
}

/** Recognize one captcha image (PNG/JPEG bytes). One attempt — the caller
 *  owns retries/limits; low-quality results return manual-required upstream. */
export async function recognizeImage(image: Uint8Array): Promise<RecognizeResult> {
  if (!isInstalled()) {
    return { kind: "unavailable", reason: startError ?? "recognizer not installed" };
  }
  if (!ready) {
    const ok = await startWorker();
    if (!ok) return { kind: "unavailable", reason: startError ?? "worker not ready" };
  }
  const proc = worker;
  if (!proc || !proc.stdin || !ready) {
    return { kind: "unavailable", reason: "worker not ready" };
  }

  const id = randomUUID();
  return new Promise<RecognizeResult>((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve({ kind: "unavailable", reason: "recognition timeout" });
    }, RECOGNIZE_TIMEOUT_MS);
    pending.set(id, { resolve, timer });
    try {
      proc.stdin!.write(
        JSON.stringify({ id, image: Buffer.from(image).toString("base64") }) + "\n",
      );
    } catch (e) {
      pending.delete(id);
      clearTimeout(timer);
      resolve({ kind: "unavailable", reason: `worker write failed: ${e instanceof Error ? e.message : e}` });
    }
  });
}

export async function recognizerHealth(): Promise<RecognizerHealth> {
  const installed = isInstalled();
  if (!installed) {
    return { installed: false, healthy: false, enabled: isAutoEnabled(), reason: "venv/worker not found — run setup" };
  }
  if (ready) return { installed: true, healthy: true, enabled: isAutoEnabled() };
  const ok = await startWorker();
  return {
    installed: true,
    healthy: ok,
    enabled: isAutoEnabled(),
    reason: ok ? undefined : startError ?? "worker did not become ready",
  };
}
