"use client";

// /settings — real, live-backed settings: interface language, AI provider
// health (from /api/health — capabilities only, no secrets), search source
// states. No dead controls.

import { useEffect, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import { LOCALES, type Locale } from "@/lib/i18n/dictionaries";

interface ProviderHealth {
  status: string;
  detail?: string;
}

export default function SettingsPage() {
  const { t, locale, setLocale } = useLocale();
  const [ai, setAi] = useState<Record<string, ProviderHealth> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setAi(j.aiProviders ?? null); })
      .catch(() => { if (!cancelled) setAi(null); });
    return () => { cancelled = true; };
  }, []);

  const statusColor = (s: string) =>
    s === "HEALTHY" ? "text-[var(--success)]" : s === "AUTH_REQUIRED" ? "text-[var(--warning)]" : "text-[var(--text-muted)]";

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
        <SettingsIcon className="h-5 w-5 text-[var(--gold-primary)]" /> {t.nav.settings}
      </h1>

      <section className="gp-glass mb-4 p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{t.common.settingsLanguage}</h2>
        <div className="flex gap-2" role="group" aria-label={t.common.settingsLanguage}>
          {LOCALES.map((l: Locale) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              aria-pressed={locale === l}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                locale === l
                  ? "border-[var(--border-active)] bg-[var(--gold-primary)] font-semibold text-[#17120a]"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-active)]"
              }`}
            >
              {l === "hy" ? "Հայերեն" : l === "ru" ? "Русский" : "English"}
            </button>
          ))}
        </div>
      </section>

      <section className="gp-glass p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{t.common.settingsAi}</h2>
        {ai === null && <div className="h-16 animate-pulse rounded bg-white/5" />}
        {ai && (
          <ul className="space-y-2">
            {Object.entries(ai).map(([id, h]) => (
              <li key={id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] px-3 py-2">
                <span className="font-mono text-[13px] text-[var(--text-primary)]">{id}</span>
                <span className="min-w-0 truncate text-right text-[12px]">
                  <span className={`font-semibold ${statusColor(h.status)}`}>{h.status}</span>
                  {h.detail ? <span className="block text-[var(--text-muted)]">{h.detail}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
          Կարգավորումները (.env) կիրառվում են սերվերի կողմից՝ առանց բանալիների UI հասցնելու։
        </p>
      </section>
    </div>
  );
}
