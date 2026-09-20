"use client";

// Home — representative mode (spec §05/§07): brand hero on the approved
// background, big legal-search pill, six action cards, REAL KPI / recent /
// today panels fed by /api/dashboard. No invented numbers: loading → skeleton,
// real zero → 0, error → «Հասանելի չէ» + retry.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderOpen, FileText, Scale, BookOpen, BrainCircuit, BarChart3,
  ArrowRight, Plus, RefreshCw, CalendarClock,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

interface DashboardData {
  kpis: Record<
    "activeCases" | "documents" | "savedPrecedents" | "upcomingHearings",
    { value: number | null; available: boolean }
  >;
  recentCases: { id: string; title: string; caseType: string; viewedAt: string }[] | null;
  today: {
    available: boolean;
    events?: {
      id: string; type: string; title: string; startsAt: string | null;
      allDay: boolean; dateOnly: string | null; location: string | null;
      caseId: string | null; case?: { title: string } | null;
    }[];
    tasks?: { id: string; title: string; priority: string }[];
  };
}

type KpiState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; value: number | null };

const TODAY_TYPE_LABEL: Record<string, "hearing" | "meeting" | "deadline" | "task"> = {
  HEARING: "hearing",
  MEETING: "meeting",
  DEADLINE: "deadline",
  REMINDER: "meeting",
};

export default function DashboardPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/dashboard");
      setData(r.ok ? ((await r.json()) as DashboardData) : null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred initial fetch (no synchronous setState from the effect body).
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const submitSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const kpiState = (k?: { value: number | null; available: boolean }): KpiState => {
    if (loading) return { kind: "loading" };
    if (!data || !k || !k.available) return { kind: "error" };
    return { kind: "ready", value: k.value };
  };

  const cards = [
    { href: "/cases", icon: FolderOpen, title: t.home.cards.myCases, sub: t.home.cards.myCasesSub },
    { href: "/documents", icon: FileText, title: t.home.cards.documents, sub: t.home.cards.documentsSub },
    { href: "/precedents", icon: Scale, title: t.home.cards.precedents, sub: t.home.cards.precedentsSub },
    { href: "/legislation", icon: BookOpen, title: t.home.cards.legislation, sub: t.home.cards.legislationSub },
    { href: "/assistant", icon: BrainCircuit, title: t.home.cards.assistant, sub: t.home.cards.assistantSub },
    { href: "/analytics", icon: BarChart3, title: t.home.cards.analytics, sub: t.home.cards.analyticsSub },
  ];

  const kpiCards = [
    { key: "activeCases" as const, label: t.home.kpi.activeCases, unit: t.home.kpi.casesUnit, href: "/cases" },
    { key: "documents" as const, label: t.home.kpi.documents, unit: t.home.kpi.documentsUnit, href: "/documents" },
    { key: "savedPrecedents" as const, label: t.home.kpi.savedPrecedents, unit: t.home.kpi.precedentsUnit, href: "/precedents" },
    { key: "upcomingHearings" as const, label: t.home.kpi.upcomingHearings, unit: t.home.kpi.hearingsUnit, href: "/calendar" },
  ];

  return (
    <div className="min-h-screen pb-10">
      {/* HERO — representative mode. The approved background carries the crest +
          wordmark at top-center; the DOM adds the motto line, search and chips.
          Decor is pointer-events:none via the background layering. */}
      <section className="relative isolate overflow-hidden border-b border-[var(--border-subtle)]">
        <div
          aria-hidden
          className="gp-decor absolute inset-0 -z-10 bg-cover bg-top"
          style={{ backgroundImage: "url(/background.png)" }}
        />
        {/* legibility gradient under interactive area */}
        <div aria-hidden className="gp-decor absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-[var(--app-bg)]" />

        <div className="mx-auto flex min-h-[440px] w-full max-w-6xl flex-col items-center justify-end px-4 pb-8 pt-[290px] sm:pt-[300px]">
          {/* Motto — DOM text directly under the baked wordmark */}
          <p aria-hidden className="mb-5 font-wordmark text-sm tracking-[0.35em] text-[var(--gold-light)]/90">
            {t.brand.motto}
          </p>

          {/* Big legal-search pill */}
          <form
            role="search"
            className="flex w-full max-w-3xl items-center gap-2 rounded-full border border-[var(--border-active)] bg-[rgba(10,11,10,0.82)] p-2 pl-5 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-md"
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch(query);
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.home.searchPlaceholder}
              aria-label={t.nav.search}
              className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            />
            <button
              type="submit"
              aria-label={t.home.searchAction}
              className="gp-gold-cta flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-[1.03]"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>

          {/* Scope chips → pre-filtered search */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {(
              [
                { label: t.home.chips.legislation, q: "ՀՀ օրենսգիրք" },
                { label: t.home.chips.cassation, q: "Վճռաբեկ դատարան" },
                { label: t.home.chips.echr, q: "ՄԻԵԴ" },
                { label: t.home.chips.constitutional, q: "Սահմանադրական դատարան" },
              ] as const
            ).map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => router.push(`/search?q=${encodeURIComponent(chip.q)}`)}
                className="rounded-full border border-[var(--border-subtle)] bg-black/40 px-4 py-1.5 text-[13px] text-[var(--gold-light)] backdrop-blur-sm transition-colors hover:border-[var(--border-active)] hover:bg-black/60"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SIX ACTION CARDS */}
      <section aria-label={t.nav.home} className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.href}
                href={c.href}
                className="gp-glass group flex flex-col gap-2 p-4 transition-colors hover:border-[var(--border-active)]"
              >
                <Icon className="h-6 w-6 text-[var(--gold-primary)]" />
                <span className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{c.title}</span>
                <span className="flex items-center gap-1 text-[12px] text-[var(--text-muted)]">
                  {c.sub}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* KPI + RECENT + TODAY */}
      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 pt-6 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,3fr)]">
        {/* KPI panel */}
        <div className="gp-glass p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">{t.home.kpi.title}</h2>
            <span className="rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
              {t.home.kpi.period}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {kpiCards.map((k) => {
              const st = kpiState(data?.kpis[k.key]);
              return (
                <Link
                  key={k.key}
                  href={k.href}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-3 transition-colors hover:border-[var(--border-active)]"
                >
                  <div className="text-2xl font-semibold tabular-nums text-[var(--gold-light)]">
                    {st.kind === "loading" && <span className="inline-block h-7 w-12 animate-pulse rounded bg-white/10" />}
                    {st.kind === "error" && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); void load(); }}
                        className="flex items-center gap-1 text-sm text-[var(--warning)]"
                        aria-label={t.home.kpi.retry}
                      >
                        <RefreshCw className="h-4 w-4" /> {t.home.kpi.unavailable}
                      </button>
                    )}
                    {st.kind === "ready" && (st.value ?? 0)}
                  </div>
                  <div className="mt-1 text-[12px] text-[var(--text-muted)]">{k.label}</div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent cases */}
        <div className="gp-glass p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{t.home.recent.title}</h2>
          {loading && <div className="h-20 animate-pulse rounded bg-white/5" />}
          {!loading && data?.recentCases === null && (
            <p className="text-sm text-[var(--warning)]">{t.home.kpi.unavailable}</p>
          )}
          {!loading && data?.recentCases != null && data.recentCases.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">{t.home.recent.empty}</p>
          )}
          {!loading && (data?.recentCases?.length ?? 0) > 0 && (
            <ul className="divide-y divide-[var(--border-subtle)]">
              {data?.recentCases?.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/cases/${c.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-white/5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-[var(--text-primary)]">{c.title}</span>
                      <span className="text-[11px] text-[var(--text-muted)]">{c.caseType}</span>
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-[var(--text-muted)]">
                      {new Date(c.viewedAt).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Today */}
        <div className="gp-glass p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
              <CalendarClock className="h-4 w-4 text-[var(--gold-primary)]" />
              {t.home.today.title}
            </h2>
            <Link
              href="/calendar"
              className="gp-gold-cta inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" /> {t.home.today.newEvent}
            </Link>
          </div>
          {loading && <div className="h-20 animate-pulse rounded bg-white/5" />}
          {!loading && (!data?.today.available) && (
            <p className="text-sm text-[var(--warning)]">{t.home.kpi.unavailable}</p>
          )}
          {!loading && data?.today.available &&
            (data.today.events?.length ?? 0) === 0 && (data.today.tasks?.length ?? 0) === 0 && (
            <p className="text-sm text-[var(--text-muted)]">{t.home.today.empty}</p>
          )}
          {!loading && data?.today.available && (
            <ul className="space-y-1.5">
              {data.today.events?.slice(0, 6).map((e) => (
                <li key={e.id} className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5">
                  <span className="w-12 shrink-0 text-[11px] font-semibold tabular-nums text-[var(--gold-light)]">
                    {e.allDay || !e.startsAt
                      ? "—"
                      : new Date(e.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-[var(--text-primary)]">{e.title}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {t.home.today[TODAY_TYPE_LABEL[e.type] ?? "meeting"]}
                      {e.case?.title ? ` · ${e.case.title}` : ""}
                    </span>
                  </span>
                </li>
              ))}
              {data.today.tasks?.slice(0, 4).map((task) => (
                <li key={task.id} className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5">
                  <span className="w-12 shrink-0 text-[11px] font-semibold text-[var(--warning)]">◉</span>
                  <span className="min-w-0 truncate text-sm text-[var(--text-primary)]">{task.title}</span>
                  <span className="ml-auto shrink-0 text-[11px] text-[var(--text-muted)]">{t.home.today.task}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
