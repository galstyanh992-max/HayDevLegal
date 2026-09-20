"use client";

// /search — the legal search flow (quick/deep federated search + AI answer),
// moved from the old single-page home. Focus mode: plain app background,
// no hero decor (spec §05) — maximum space for results.

import { useCallback, useEffect, useRef, useState } from "react";
import { SearchBox } from "@/components/legal/SearchBox";
import { SearchResults } from "@/components/legal/SearchResults";
import { AgentAnswer } from "@/components/legal/AgentAnswer";
import { SearchingState, ErrorState, EmptyState } from "@/components/legal/States";
import { DateSensitivityBanner } from "@/components/legal/DateSensitivityBanner";
import { SearchInsights } from "@/components/legal/SearchInsights";
import { SearchTracePanel } from "@/components/legal/SearchTracePanel";
import { SearchWarnings } from "@/components/legal/SearchWarnings";
import { SearchModeToggle } from "@/components/legal/SearchModeToggle";
import { SourceConfirmDialog } from "@/components/legal/SourceConfirmDialog";
import { ArgumentMapPanel } from "@/components/legal/ArgumentMapPanel";
import { ResearchSummary } from "@/components/legal/ResearchSummary";
import type { LegalSource, LegalQuery } from "@/lib/legal/types";
import type {
  FederatedSearchResponse,
  SearchMode,
  SearchTrace,
  SearchWarning,
} from "@/lib/legal-search/types";
import type { ResearchReport } from "@/lib/legal-research/types";

type View = "home" | "searching" | "results" | "error" | "empty";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("home");
  const [mode, setMode] = useState<SearchMode>("quick");
  const [results, setResults] = useState<LegalSource[]>([]);
  const [parsedQuery, setParsedQuery] = useState<LegalQuery | undefined>();
  const [trace, setTrace] = useState<SearchTrace | undefined>();
  const [warnings, setWarnings] = useState<SearchWarning[]>([]);
  const [research, setResearch] = useState<ResearchReport | undefined>();
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [retrievalMs, setRetrievalMs] = useState<number | undefined>();
  const [confirmTarget, setConfirmTarget] = useState<LegalSource | null>(null);
  const searchNonce = useRef(0);

  // Hydrate from URL ?q= & mode= on first load.
  useEffect(() => {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("q");
    const m = url.searchParams.get("mode") === "deep" ? "deep" : "quick";
    if (q && q.trim()) {
      setMode(m);
      setQuery(q);
      void runSearch(q, m);
    }
  }, []);

  // Keep URL in sync with query (shareable / refreshable).
  const updateUrl = useCallback((q: string, m: SearchMode) => {
    const url = new URL(window.location.href);
    if (q.trim()) {
      url.searchParams.set("q", q.trim());
      if (m === "deep") url.searchParams.set("mode", "deep");
      else url.searchParams.delete("mode");
    } else {
      url.searchParams.delete("q");
      url.searchParams.delete("mode");
    }
    window.history.replaceState({}, "", url.toString());
  }, []);

  const runSearch = useCallback(
    async (q: string, m: SearchMode) => {
      const nonce = ++searchNonce.current;
      setQuery(q);
      setMode(m);
      setView("searching");
      setResults([]);
      setTrace(undefined);
      setWarnings([]);
      setResearch(undefined);
      setErrorMsg(undefined);
      setRetrievalMs(undefined);
      updateUrl(q, m);

      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query: q, mode: m }),
        });
        if (nonce !== searchNonce.current) return; // superseded
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as FederatedSearchResponse;
        if (nonce !== searchNonce.current) return;
        setRetrievalMs(data.retrieval?.durationMs);
        setParsedQuery(data.parsed);
        setTrace(data.trace);
        setWarnings(data.warnings ?? []);
        setResearch(data.research);
        if (!data.retrieval?.ok && data.evidence?.length === 0) {
          setErrorMsg(data.retrieval?.error);
          setView("error");
          return;
        }
        setResults(data.results);
        setView(data.results.length > 0 ? "results" : "empty");
      } catch (err) {
        if (nonce !== searchNonce.current) return;
        console.error("[search] failed:", err);
        setErrorMsg(
          err instanceof Error ? err.message : "Որոնումը ժամանակավորապես անհասանելի է։",
        );
        setView("error");
      }
    },
    [updateUrl],
  );

  const onSearchBoxSubmit = useCallback(
    (q: string) => {
      void runSearch(q, mode);
    },
    [runSearch, mode],
  );

  const onModeChange = useCallback(
    (m: SearchMode) => {
      setMode(m);
      if (query.trim()) void runSearch(query, m);
    },
    [query, runSearch],
  );

  const onEvidenceResolved = useCallback(
    (passages: string[], _url: string, textPreview: string) => {
      setConfirmTarget((prev) => {
        if (!prev) return null;
        const ref = prev.documentRef;
        setResults((rs) =>
          rs.map((r) =>
            r.documentRef && r.documentRef === ref
              ? {
                  ...r,
                  accessState: undefined,
                  fullTextVerified: true,
                  evidenceGrade: "PRIMARY_VERIFIED" as const,
                  excerpt: (passages[0] ?? textPreview).slice(0, 400),
                  fullRetrievedText: (passages[0] ?? textPreview).slice(0, 1200),
                }
              : r,
          ),
        );
        return null;
      });
    },
    [],
  );

  const isHome = view === "home";
  const modeToggle = (
    <SearchModeToggle mode={mode} onChange={onModeChange} disabled={view === "searching"} />
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-4">
          <SearchBox
            initialQuery={query}
            onSubmit={onSearchBoxSubmit}
            size={isHome ? "hero" : "compact"}
            isLoading={view === "searching"}
            autoFocus={isHome}
          />
        </div>

        {!isHome && <div className="mb-4">{modeToggle}</div>}
        {isHome && (
          <div className="mt-4 flex justify-center">
            {modeToggle}
          </div>
        )}

        {view === "searching" && <SearchingState query={query} />}
        {view === "error" && (
          <ErrorState message={errorMsg} onRetry={() => runSearch(query, mode)} />
        )}
        {view === "empty" && <EmptyState query={query} />}

        {view === "results" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-[var(--gold-primary)]">
                <span className="text-[var(--gold-deep)]">Հարցում՝</span>{" "}
                <span className="font-medium text-[var(--gold-light)]">{query}</span>
              </p>
              {modeToggle}
            </div>

            <SearchInsights parsed={parsedQuery} resultCount={results.length} retrievalMs={retrievalMs} />
            {research && <ResearchSummary research={research} evidenceCount={results.length} />}
            {trace && <SearchTracePanel trace={trace} />}
            <SearchWarnings warnings={warnings} />
            <DateSensitivityBanner parsed={parsedQuery} />
            {research && <ArgumentMapPanel research={research} />}
            <SearchResults
              results={results}
              query={query}
              onRequireConfirm={(s) => setConfirmTarget(s)}
              research={research}
            />
            <div className="pt-2">
              <AgentAnswer
                key={`${query}|${mode}`}
                query={query}
                sources={results}
                autoStart
                warnings={warnings.map((w) => w.message)}
                research={research}
                dateContext={parsedQuery ? {
                  date: parsedQuery.date,
                  wantsHistorical: parsedQuery.wantsHistoricalLaw,
                  wantsCurrent: parsedQuery.wantsCurrentLaw,
                } : undefined}
              />
            </div>
          </div>
        )}
      </div>

      {/* Phase 3 §25/§63-§64 — interactive source confirmation (CAPTCHA) */}
      {confirmTarget && (
        <SourceConfirmDialog
          source={confirmTarget}
          query={query}
          onClose={() => setConfirmTarget(null)}
          onResolved={onEvidenceResolved}
        />
      )}
    </div>
  );
}
