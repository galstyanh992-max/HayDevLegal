# BASELINE — Galstyan & Partners redesign (2026-09-20)

## Repository state at baseline

- Local: `C:\Users\Admin\.zcode\workspace\default\HayDevLegal`, branch `main`,
  HEAD `7fbc355` ("fix(windows): make AI runtime operational on Windows + honest
  provider health"), ahead of origin/main by 1. **No push performed.**
- Working tree at baseline start: `db/custom.db` modified (runtime data from
  live use), untracked `download/*-DRAFT.docx` (user draft export),
  `references/` (new).

## Runtime / environment (Windows-first)

- OS Windows 10 (10.0.22631), shell Git Bash, Bun **1.3.14**, Node for Next server.
- Next.js **16.1.1** (Turbopack dev + build), React 19, TypeScript 5, Tailwind 4,
  shadcn/Radix, Prisma 6 + SQLite (`db/custom.db`), next-intl **installed but not
  wired** (app strings are hardcoded հայերեն).
- Dev server: `bun run dev` → **port 3001** (3000 occupied by HayDevLeadsOS —
  untouched). Start detached on Windows: `nohup bun run dev >/dev/null 2>&1 & disown`
  (harness background tasks reap the process tree otherwise).
- Build: `bun run build` = `next build && bun scripts/copy-standalone.ts`
  (cross-platform copy; the old Unix `cp -r` failed on Windows). Build must run
  **without** the dev server holding `.next` (Turbopack conflict).
- `bun run start` (standalone prod server) is NOT functional on this machine:
  Next 16.1.1 Turbopack does not emit `.next/standalone/server.js` here
  (upstream limitation, pre-existing). Dev mode is the verified runtime.

## Baseline verification commands (fresh run 2026-09-20)

| Check | Command | Result |
|---|---|---|
| Typecheck | `bun run typecheck` | **exit 0** |
| Lint | `bun run lint` | **exit 0** |
| Tests | `bun test` | **336 pass / 17 fail** (353 tests, 24 files, ~50s) |
| Build | `bun run build` | **exit 0** |
| Dev boot | `bun run dev` → GET / | **HTTP 200** |

The 17 failing tests are ALL in `tests/unit/legal-drafting-formatting.test.ts`
(§1–§19 visual QA): they require **LibreOffice (soffice), poppler
(pdfinfo/pdftoppm) and the DejaVuSans font** — documented in LOCAL_SETUP.md as
optional QA dependencies, absent on this machine. They failed identically
before any redesign work; they are the accepted baseline failure set. Any NEW
failure during the redesign must be attributed to that slice, not to this set.

## SQLite backup (made BEFORE any schema/UI change)

- `backups/db-before-redesign-20260920.db` — created with `VACUUM INTO`
  (consistent snapshot while the server was running, WAL-safe).
- Restore verified on a separate copy: opened read-only via Prisma with
  `DATABASE_URL` pointed at the backup → `cases = 2, documents = 1`
  (matches live DB).
- Rollback procedure: stop dev server → `copy backups\db-before-redesign-20260920.db db\custom.db`
  (delete `db\custom.db-wal` / `-shm` if present) → restart dev server.

## Datalex findings (§14 of the task) — confirmation status at baseline

Findings C/D/E/F/G/H/I/J from the master prompt are **not yet confirmed** on
the local branch. They will each be confirmed by a reproducing unit test
BEFORE being fixed (per §14: "сначала подтвердить тестом/трассировкой и затем
исправлять минимально"). See IMPLEMENTATION_PLAN.md Stage F.

## OCR worker prerequisites (Stage G)

- Python launcher present on PATH (3.14 via py area) — ddddocr wheel support
  for 3.14 / Windows is unverified; will attempt in an isolated venv.
- If installation is blocked (no wheel / no compiler), outcome is the honest
  **ENVIRONMENT_BLOCKED** with prepared wrapper + fixture tests, per §19.
