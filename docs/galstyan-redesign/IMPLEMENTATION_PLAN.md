# IMPLEMENTATION PLAN — Galstyan & Partners (stages A–I)

Visual spec: `references/approved-dashboard.png` + clean brand background
`public/background.png` (crest: shield G + crown + two lions + laurel).
Working cadence per slice: minimal change → typecheck → targeted tests →
browser smoke → fix → repeat. Full regression + build before delivery.

## Stage A — baseline, backup, assets (DONE)

- [x] Baseline tsc/lint/test/build recorded (BASELINE.md)
- [x] SQLite backup + restore verification
- [x] Assets extracted: `public/brand/crest.png` (crest only, for
      sidebar/topbar), `public/brand/marble-left.png`, `public/brand/themis-right.png`
      (decorative strips for representative mode), full clean hero background
      `public/background.png` (replaced old masonic-compass artwork per spec §03)

## Stage B — design tokens, brand, app shell

- `globals.css`: semantic tokens from spec §04 (--app-bg, --surface-*,
  --gold-*, --border-*, --text-*, status colors) + glass/marble material
  utilities; reduced-motion opt-out; focus-visible ring.
- Fonts: keep system/Noto Sans Armenian stack + licensed serif (Cormorant
  Garamond, Google/OFL) for the Latin wordmark only.
- `AppShell` component: fixed sidebar 232–248px (collapsible 72–80px,
  localStorage), topbar 60–68px (command search → existing search, language
  switch, notifications placeholder wired to real data later, profile),
  content area. Mobile ≤768px: sidebar → drawer.
- Routes (App Router): `/` dashboard; `/search` (existing search flow moved);
  `/cases` (existing CaseWorkspace list); `/cases/[id]` (workspace);
  `/documents`, `/legislation`, `/precedents`, `/assistant`, `/analytics`,
  `/calendar`, `/collaboration`, `/settings` (real pages or explicit
  "раздел в построении" states only where no data exists yet — no fake cards).
  Old deep links (`/?q=`, `/#search`, workspace hash) → redirects.
- Brand: layout metadata → "Galstyan & Partners"; favicon from crest;
  remove «ЮРИСТ» line and center ad slogans (they exist only in the raster,
  DOM never re-adds them). Wordmark + `LEX · AEQUITAS · HUMANITAS` as DOM text.
- Focus mode: case/reader/draft routes render without hero decor (plain
  `--app-bg`), toggle persisted in UserPreference (Stage E).

## Stage C — dashboard with real data

- `GET /api/dashboard` — single aggregate endpoint:
  KPIs (active cases, documents, saved precedents, upcoming hearings 7d),
  recent views, today (hearings/tasks/deadlines in user timezone).
  Counts are real SQL counts; zero ≠ unavailable; error → "Недоступно" + retry.
- Six action cards → real routes. Stats panel with 4 KPI cards (real values,
  drill-down links). «Недавние дела» from RecentView. «Сегодня» from
  CalendarEvent+Task. Skeletons while loading.

## Stage D — case workspace / documents / research / AI / drafts redesign

- Re-skin existing components (CaseDetail tabs, DocumentList, UploadZone,
  SearchResults, SourceConfirmDialog, AgentAnswer, DraftsView, AnalysisView,
  StrategyView) onto tokens; keep all logic/props/APIs. Focus mode for
  reader/editor. No logic rewrites in this stage.

## Stage E — Task / CalendarEvent / RecentView / UserPreference models

- Additive Prisma migration (backup exists; migration tested on a COPY of the
  DB first). Models per spec §13 (status enums, dueAt, timezone, version).
- REST: `/api/tasks`, `/api/calendar`, `/api/preferences` with Zod validation,
  owner scope, idempotency where duplication is possible.

## Stage F — Datalex correctness (each finding: repro test → minimal fix)

- F/C: `updateSession` create-branch sets `captchaKeyAt` when storing an
  accepted key (test: new accepted session survives first getSession).
- F/D: `/api/resolve` prefers fresh user input; stale replayKey invalidated on
  source rejection (test: old key rejected → fresh input used).
- F/E: SourceConfirmDialog carries sessionId; server binds session → owner.
- F/G: challenge owner binding + generation (substitution test).
- F/H/I: image proxy streaming byte cap + type sniff + nosniff + no-store;
  one image per generation, explicit refresh.
- F/J: coverage/truncated/textStatus + charCount vs UTF-8 byteCount separation.
- Limits: bootstrap/image/refresh/submit rate budgets (central config).

## Stage G — local OCR provider (ddddocr)

- `captcha-recognizer/` isolated Python venv worker (JSONL stdin/stdout,
  base64 images, request id + generation correlation, bounded queue, timeout,
  self-test fixture). Node adapter `src/lib/legal-search/captcha/recognizer.ts`
  implementing the `CaptchaRecognizer` interface (§19). Settings expose
  installed / health / enabled separately; auto mode OFF by default,
  AUTO_WITH_MANUAL_FALLBACK opt-in; manual dialog always available.
- If Python 3.14 wheels unavailable → ENVIRONMENT_BLOCKED report with prepared
  code + fixture tests (honest, per §19).

## Stage H — security / a11y / regression

- fetchGuarded policy unchanged; OCR transport is a fixed internal allowlisted
  channel, not a localhost bypass. Secret scan of the diff. Keyboard pass
  (sidebar → search → card → captcha → editor → export). Focus trap in dialogs
  (Radix). HY/RU/EN switch keeps query/case/draft context. Full `bun test`,
  `bun run build`, console-errors=0 smoke at 1920/1366/1024/390.

## Stage I — delivery

- docs: DESIGN_SYSTEM.md, WORKFLOWS.md, DATALEX_CAPTCHA.md,
  THIRD_PARTY_COMPONENTS.md, TEST_REPORT.md, RELEASE_REPORT.md, screenshots/.
- Status block per §27 with honest PASS/PARTIAL/NOT_VERIFIED values.
