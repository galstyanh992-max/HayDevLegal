"use client";

// /precedents — saved case law. Real count over case-linked precedent
// citations; deep-search entry for finding new ones.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Scale } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

export default function PrecedentsPage() {
  const { t } = useLocale();
  const [saved, setSaved] = useState<{ citation: string; source: string; caseTitle: string; caseId: string }[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/precedents")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => { if (!cancelled) setSaved(j.saved ?? []); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
          <Scale className="h-5 w-5 text-[var(--gold-primary)]" /> {t.nav.precedents}
        </h1>
        <Link
          href="/search?q=%D4%B2%D5%A1%D5%B6%D5%A1%D5%AF%D6%81%D5%B8%D6%82%D5%A9%D5%B5%D5%B8%D6%82%D5%B6&mode=deep"
          className="rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--gold-light)] hover:border-[var(--border-active)]"
        >
          {t.home.cards.precedentsSub} →
        </Link>
      </div>

      {failed && <div className="gp-glass p-4 text-sm text-[var(--warning)]">{t.home.kpi.unavailable}</div>}
      {!failed && saved === null && <div className="h-24 animate-pulse rounded-xl bg-white/5" />}
      {!failed && saved != null && saved.length === 0 && (
        <div className="gp-glass p-6 text-sm text-[var(--text-muted)]">
          {t.home.kpi.empty} — {t.home.cards.precedentsSub} (Datalex · ՄԻԵԴ · Վճռաբեկ)
        </div>
      )}
      {!failed && saved != null && saved.length > 0 && (
        <ul className="space-y-2">
          {saved.map((p, i) => (
            <li key={`${p.citation}-${i}`} className="gp-glass p-3">
              <div className="text-sm text-[var(--text-primary)]">{p.citation}</div>
              <div className="text-[12px] text-[var(--text-muted)]">
                {p.source} · <Link className="text-[var(--gold-light)] hover:underline" href={`/cases/${p.caseId}`}>{p.caseTitle}</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
