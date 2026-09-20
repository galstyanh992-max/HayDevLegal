"use client";

// /legislation — browse the curated local corpus (real local-laws data via the
// same loader the search adapter uses) + a legal-search entry point.

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

interface CorpusStats {
  acts: number;
  articles: number;
  categories: { category: string; shortTitle: string; acts: number; articles: number }[];
  available: boolean;
}

// The local-laws loader is server-side; expose stats through the search API's
// adapter health instead of a new service surface. We reuse /api/search with a
// single broad query per category — but that is slow. Better: a tiny stats API.
export default function LegislationPage() {
  const { t } = useLocale();
  const [stats, setStats] = useState<CorpusStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/legislation/browse")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => { if (!cancelled) setStats(j.stats); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
          <BookOpen className="h-5 w-5 text-[var(--gold-primary)]" /> {t.nav.legislation}
        </h1>
        <Link
          href="/search?q=%D5%80%D5%80%20%D5%B8%D6%80%D5%A5%D5%B6%D5%BD%D5%A3%D5%AB%D6%80%D5%A5%D6%80"
          className="rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--gold-light)] hover:border-[var(--border-active)]"
        >
          {t.nav.search} →
        </Link>
      </div>

      {failed && (
        <div className="gp-glass p-4 text-sm text-[var(--warning)]">{t.home.kpi.unavailable}</div>
      )}
      {!failed && !stats && <div className="h-32 animate-pulse rounded-xl bg-white/5" />}
      {stats && (
        <>
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            {stats.acts} акт · {stats.articles} հոդված — տեղական ARLIS պահեստ
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.categories.map((c) => (
              <Link
                key={c.category}
                href={`/search?q=${encodeURIComponent(c.shortTitle)}`}
                className="gp-glass p-4 transition-colors hover:border-[var(--border-active)]"
              >
                <div className="text-sm font-semibold text-[var(--text-primary)]">{c.shortTitle}</div>
                <div className="mt-1 text-[12px] tabular-nums text-[var(--text-muted)]">
                  {c.acts} акт · {c.articles} հոդված
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
