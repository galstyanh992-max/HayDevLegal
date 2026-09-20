"use client";

// /documents — cross-case document library (real rows via /api/documents).

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Search } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

interface DocRow {
  id: string;
  caseId: string;
  displayName: string;
  originalFilename: string | null;
  documentType: string;
  pageCount: number;
  processingStatus: string;
  sizeBytes: number | null;
  createdAt: string;
  case?: { title: string } | null;
}

export default function DocumentsPage() {
  const { t } = useLocale();
  const [docs, setDocs] = useState<DocRow[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async (query: string) => {
    try {
      const r = await fetch(`/api/documents${query ? `?q=${encodeURIComponent(query)}` : ""}`);
      if (!r.ok) {
        setDocs(null);
        setError(true);
        return;
      }
      setDocs((await r.json()).documents);
      setError(false);
    } catch {
      setDocs(null);
      setError(true);
    }
  }, []);

  useEffect(() => {
    // Deferred initial fetch (no synchronous setState from the effect body).
    const id = window.setTimeout(() => { void load(""); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">{t.nav.documents}</h1>
        <form
          className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            void load(q);
          }}
        >
          <Search className="h-4 w-4 text-[var(--text-muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="PDF, DOCX…"
            className="w-48 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
            aria-label={t.nav.search}
          />
        </form>
      </div>

      {error && (
        <div className="gp-glass p-4 text-sm text-[var(--warning)]">
          {t.home.kpi.unavailable}
          <button type="button" className="ml-2 underline" onClick={() => void load(q)}>
            {t.home.kpi.retry}
          </button>
        </div>
      )}
      {!error && docs === null && <div className="h-32 animate-pulse rounded-xl bg-white/5" />}
      {!error && docs != null && docs.length === 0 && (
        <div className="gp-glass p-6 text-center text-sm text-[var(--text-muted)]">
          {t.home.kpi.empty} · <Link href="/cases" className="text-[var(--gold-light)] underline">{t.home.cards.myCases}</Link>
        </div>
      )}
      {!error && docs != null && docs.length > 0 && (
        <div className="gp-glass overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-left text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-4 py-2.5 font-medium">File</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Type</th>
                <th className="px-4 py-2.5 font-medium">Pages</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">{t.nav.cases}</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-b border-[var(--border-subtle)]/50 last:border-0 hover:bg-white/[0.03]">
                  <td className="max-w-[280px] px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-[var(--gold-primary)]" />
                      <span className="truncate text-[var(--text-primary)]">{d.displayName ?? d.originalFilename}</span>
                    </span>
                  </td>
                  <td className="hidden px-4 py-2.5 text-[var(--text-secondary)] sm:table-cell">{d.documentType}</td>
                  <td className="px-4 py-2.5 tabular-nums text-[var(--text-secondary)]">{d.pageCount}</td>
                  <td className="hidden max-w-[180px] px-4 py-2.5 md:table-cell">
                    <Link href={`/cases/${d.caseId}`} className="block truncate text-[var(--gold-light)] hover:underline">
                      {d.case?.title ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[11px] text-[var(--success)]">
                      {d.processingStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
