# RELEASE REPORT — Galstyan & Partners redesign + working legal workspace

Дата: 2026-09-20 · Локальная реализация, **push/deploy не выполнялись**.
Ветки/HEAD: `main` @ `7b51441` (4 коммита поверх baseline `7fbc355`).

## Status block

```
UI_IMPLEMENTED:                 PARTIAL  (shell+dashboard+все маршруты готовы; глубокие legacy-вьюхи сохраняют прежнюю тему — Stage D reskin ограничен)
WORKFLOWS_CONNECTED:            PASS     (поиск/дела/документы/календарь/задачи/аналитика — реальные API и БД)
DATALEX_SESSION_REGRESSIONS:    PASS     (findings C+D: repro-тесты → фиксы, 6/6 зелёные)
MANUAL_CAPTCHA:                 FIXTURE_PASS (живой Datalex в этом прогоне не проверялся)
OCR_WORKER:                     READY    (isolated venv + ddddocr 1.5.6, self-test OK)
OCR_FIXTURES:                   PASS     (4/4: real worker round-trip, "1234")
AUTO_CAPTCHA_LIVE:              NOT_VERIFIED (opt-in DATALEX_AUTO_CAPTCHA=true; против живой CAPTCHA попыток не делалось)
DOCUMENT_IDENTITY_COVERAGE:     NOT_VERIFIED (нужен живой resolved-документ)
BUILD_REGRESSION:               PASS     (tsc 0, eslint 0, build 0, dev 200)
```

## Команды и результаты (финальный прогон)

| Проверка | Команда | Результат |
|---|---|---|
| Typecheck | `bun run typecheck` | exit 0 |
| Lint | `bun run lint` | exit 0 |
| Тесты | `bun test` | **346 pass / 17 fail** (363 теста, 26 файлов) |
| Build | `bun run build` | exit 0 |
| Dev | `bun run dev` (:3001) | HTTP 200, все 16 маршрутов 200, console errors 0 |

17 фейлов — только `legal-drafting-formatting.test.ts` (LibreOffice+poppler+шрифт,
документированные опциональные QA-зависимости; входили в baseline до редизайна).
**Новых регрессий нет**: 346 > 336 baseline, +10 новых тестов.

## Что реализовано

**Бренд/UI (B)**: дизайн-токены §04, AppShell (мраморный сайдбар со сворачиванием,
топбар, drawer), герб (щит G/корона/львы/лавр — из чистого бренд-арта, старый
«циркуль» удалён), wordmark Cormorant Garamond (OFL), HY/RU/EN (контекст
сохраняется), representative/focus режимы. Метаданные, favicon → Galstyan & Partners.

**Маршруты/данные (C/E)**: /, /search, /cases, /cases/[id] (deep-link+URL sync),
/documents, /legislation, /precedents, /assistant, /analytics, /calendar,
/collaboration (честный local-mode), /settings (живой health провайдеров).
Additive-миграция: Task, CalendarEvent (allDay=dateOnly), RecentView,
UserPreference — протестирована на копии, SQL в docs/galstyan-redesign/migrations/.
Дашборд: реальные KPI (сейчас: 8 дел, 22 документа, 2 прецедента, 0 заседаний),
недавние дела, «Сегодня», drilldown согласован со списками.

**Datalex (F)**: findings C и D подтверждены repro-тестами и исправлены:
C — create-ветка updateSession теряла captchaKey+captchaKeyAt (ключ исчезал при
первом getSession); D — свежий ввод теперь главнее stored replay-ключа, отвергнутый
ключ инвалидируется (cookies сохраняются). Тесты: datalex-session-correctness (6).

**OCR (G)**: `captcha-recognizer/` — изолированный venv (Python 3.11) + ddddocr
1.5.6, персистентный JSONL-worker, Node-адаптер (таймаут 10с, 256KiB cap,
crash-safe), `/api/resolve/captcha/auto` — ОДНА попытка на вызов, opt-in
`DATALEX_AUTO_CAPTCHA=true`, consumes token-attempt budget, manual fallback во всех
ветках; `/api/resolve/captcha/auto-status` — installed/healthy/enabled раздельно.
Fixtures: 4/4 (round-trip «1234»).

## Известные ограничения (честно)

1. **AUTO_CAPTCHA_LIVE: NOT_VERIFIED** — точность ddddocr на текущей CAPTCHA
   Datalex не измерялась; включать только после ограниченного live-smoke (§20).
2. **Глубокие legacy-вьюхи** (результаты поиска, табы кейса) сохраняют прежнюю
   тёмную тему — shell/дашборд/новые страницы переведены на токены полностью;
   оставшийся reskin — Stage D PARTIAL.
3. **i18n**: новые страницы — HY/RU/EN полностью; legacy-вьюхи — հայերեն.
4. `bun run start` (standalone) не работает на этой машине (Turbopack Next
   16.1.1 не эмитит server.js — upstream); рабочий режим — dev на :3001.
5. Тесты visual-QA (17) требуют LibreOffice/poppler/DejaVuSans.
6. SourceConfirmDialog: кнопка авто-распознавания не добавлена в UI (API готов,
   manual-путь без изменений) — следующий срез.

## Откат

- Код: `git revert`/`reset` до `7fbc355` (не выполнялось).
- БД: `backups/db-before-redesign-20260920.db` (VACUUM INTO, restore проверен);
  откат миграции: `DROP TABLE Task; DROP TABLE CalendarEvent; DROP TABLE RecentView;
  DROP TABLE UserPreference;`

## Безопасность

Push/deploy/внешние отправки/платные переключения — НЕТ. Секрет-скан diff —
чисто. .env остаётся незатреканным. CAPTCHA-ответы/cookies в логи не пишутся
(worker protocol не содержит payload-логирования).
