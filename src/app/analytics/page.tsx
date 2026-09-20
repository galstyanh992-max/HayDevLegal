"use client";

// /analytics — real aggregates over the actual store (no invented charts).

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

interface Analytics {
  byType: { caseType: string; count: number }[];
  byStatus: { status: string; count: number }[];
  documents: number;
  analysisRuns: number;
  drafts: number;
  available: boolean;
}

export default function AnalyticsPage() {
  const { t } = useLocale();
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/analytics")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch(() => { if (!cancelled) setData({ byType: [], byStatus: [], documents: 0, analysisRuns: 0, drafts: 0, available: false }); });
    return () => { cancelled = true; };
  }, []);

  const max = Math.max(1, ...(data?.byType.map((x) => x.count) ?? [1]));

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
        <BarChart3 className="h-5 w-5 text-[var(--gold-primary)]" /> {t.nav.analytics}
      </h1>
      {!data && <div className="h-40 animate-pulse rounded-xl bg-white/5" />}
      {data && !data.available && (
        <div className="gp-glass p-4 text-sm text-[var(--warning)]">{t.home.kpi.unavailable}</div>
      )}
      {data?.available && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="gp-glass p-4">
            <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{t.nav.cases} — {t.home.cards.analyticsSub}</h2>
            <div className="space-y-2">
              {data.byType.length === 0 && <p className="text-sm text-[var(--text-muted)]">{t.home.kpi.empty}</p>}
              {data.byType.map((x) => (
                <div key={x.caseType} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-[13px] text-[var(--text-secondary)]">{x.caseType}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-[var(--gold-primary)]" style={{ width: `${(x.count / max) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right text-[13px] tabular-nums text-[var(--gold-light)]">{x.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t.home.kpi.documents, value: data.documents },
              { label: "Analysis runs", value: data.analysisRuns },
              { label: "Drafts", value: data.drafts },
              { label: t.nav.cases, value: data.byStatus.reduce((s, x) => s + x.count, 0) },
            ].map((k) => (
              <div key={k.label} className="gp-glass p-4">
                <div className="text-2xl font-semibold tabular-nums text-[var(--gold-light)]">{k.value}</div>
                <div className="mt-1 text-[12px] text-[var(--text-muted)]">{k.label}</div>
              </div>
            ))}
            <div className="col-span-2 gp-glass p-4">
              <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Status</h3>
              <div className="flex flex-wrap gap-2">
                {data.byStatus.map((s) => (
                  <span key={s.status} className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-[12px] text-[var(--text-secondary)]">
                    {s.status}: <span className="tabular-nums text-[var(--gold-light)]">{s.count}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
