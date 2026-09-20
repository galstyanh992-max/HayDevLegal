"use client";

// Galstyan & Partners — application shell (spec §05).
// Sidebar 232–248px / collapsible 72–80px (persisted), topbar 60–68px,
// mobile drawer ≤768px. Decorative marble/Themis only in representative
// mode (home); working routes render a plain --app-bg (focus mode).

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  Scale,
  FileText,
  BrainCircuit,
  BarChart3,
  CalendarDays,
  Users,
  Settings,
  Search,
  Bell,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/dictionaries";

const SIDEBAR_KEY = "gp.sidebar.collapsed";

interface NavItem {
  href: string;
  labelKey: keyof ReturnType<typeof navLabels>;
  icon: React.ComponentType<{ className?: string }>;
}

function navLabels(t: ReturnType<typeof useLocale>["t"]) {
  return {
    home: t.nav.home,
    cases: t.nav.cases,
    legislation: t.nav.legislation,
    precedents: t.nav.precedents,
    documents: t.nav.documents,
    assistant: t.nav.assistant,
    analytics: t.nav.analytics,
    calendar: t.nav.calendar,
    collaboration: t.nav.collaboration,
    settings: t.nav.settings,
    search: t.nav.search,
  };
}

const NAV: NavItem[] = [
  { href: "/", labelKey: "home", icon: LayoutDashboard },
  { href: "/cases", labelKey: "cases", icon: FolderOpen },
  { href: "/legislation", labelKey: "legislation", icon: BookOpen },
  { href: "/precedents", labelKey: "precedents", icon: Scale },
  { href: "/documents", labelKey: "documents", icon: FileText },
  { href: "/assistant", labelKey: "assistant", icon: BrainCircuit },
  { href: "/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/calendar", labelKey: "calendar", icon: CalendarDays },
  { href: "/collaboration", labelKey: "collaboration", icon: Users },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

const LANGS: { code: Locale; label: string }[] = [
  { code: "hy", label: "ՀԱՅ" },
  { code: "ru", label: "РУС" },
  { code: "en", label: "ENG" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // Two-pass hydration-safe init (deferred — no synchronous setState).
    let saved = false;
    try {
      saved = window.localStorage.getItem(SIDEBAR_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (!saved) return;
    const id = window.setTimeout(() => setCollapsed(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const labels = navLabels(t);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const activeLabel =
    NAV.slice()
      .sort((a, b) => b.href.length - a.href.length)
      .find((n) => isActive(n.href))?.labelKey ?? "home";

  const sidebarWidth = collapsed ? "w-[76px]" : "w-[240px]";

  const sidebarInner = (
    <div className="flex h-full flex-col">
      {/* Brand — compact crest + name, no slogans (spec §03) */}
      <Link
        href="/"
        className="flex items-center gap-2.5 px-3 pb-4 pt-4"
        aria-label={t.brand.name}
      >
        <Image
          src="/brand/crest.png"
          alt=""
          width={200}
          height={105}
          priority
          className={`gp-crest-img shrink-0 ${collapsed ? "h-9 w-auto" : "h-12 w-auto"}`}
        />
        {!collapsed && (
          <span className="min-w-0">
            <span className="gp-gold-text block font-wordmark text-[15px] font-semibold leading-tight tracking-wide">
              GALSTYAN &amp; PARTNERS
            </span>
          </span>
        )}
      </Link>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2" aria-label={t.brand.name}>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? labels[item.labelKey] : undefined}
              onClick={() => setDrawerOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "border border-[var(--border-active)] bg-[var(--accent)] font-medium text-[var(--gold-light)]"
                  : "border border-transparent text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && <span className="truncate">{labels[item.labelKey]}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Maxim (sidebar, small — allowed: sidebar keeps no slogans besides this
          quote which the reference also shows at bottom-left) */}
      {!collapsed && (
        <p className="px-4 pb-3 pt-2 font-wordmark text-[11px] italic leading-snug text-[var(--gold-deep)]">
          “Fiat justitia, et pereat mundus.”
        </p>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)]">
      {/* Skip link */}
      <a
        href="#gp-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-black focus:px-3 focus:py-1.5 focus:text-[var(--gold-light)]"
      >
        {t.common.open}
      </a>

      {/* Desktop sidebar */}
      <aside
        className={`gp-marble sticky top-0 hidden h-screen shrink-0 border-r border-[var(--border-subtle)] transition-[width] duration-200 md:block ${sidebarWidth}`}
      >
        {sidebarInner}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            aria-label="close"
            className="absolute inset-0 bg-black/70"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="gp-marble absolute left-0 top-0 h-full w-[260px] border-r border-[var(--border-subtle)]">
            {sidebarInner}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-[62px] items-center gap-2 border-b border-[var(--border-subtle)] bg-[rgba(8,9,9,0.92)] px-3 backdrop-blur-md sm:px-4">
          <button
            type="button"
            className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-white/5 md:hidden"
            aria-label={t.topbar.openMenu}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="hidden rounded-md p-2 text-[var(--text-secondary)] hover:bg-white/5 md:block"
            aria-label={collapsed ? t.topbar.expandSidebar : t.topbar.collapseSidebar}
            onClick={toggleCollapsed}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>

          <span className="hidden text-sm font-medium text-[var(--text-secondary)] lg:block">
            {labels[activeLabel]}
          </span>

          <div className="flex-1" />

          {/* Command-search shortcut → global legal search */}
          <button
            type="button"
            onClick={() => router.push("/search")}
            className="flex h-9 min-w-0 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 text-sm text-[var(--text-muted)] hover:border-[var(--border-active)] hover:text-[var(--text-secondary)] sm:w-64"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">{t.topbar.searchPlaceholder}</span>
            <kbd className="ml-auto hidden shrink-0 rounded border border-[var(--border-subtle)] px-1.5 text-[10px] sm:block">
              Ctrl K
            </kbd>
          </button>

          {/* Language switcher */}
          <div
            className="flex overflow-hidden rounded-full border border-[var(--border-subtle)]"
            role="group"
            aria-label="Language"
          >
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLocale(l.code)}
                aria-pressed={locale === l.code}
                className={`px-2 py-1.5 text-[11px] font-semibold tracking-wide transition-colors ${
                  locale === l.code
                    ? "bg-[var(--gold-primary)] text-[#17120a]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Notifications — wired to real data in Stage C/E; placeholder bell is
              a link to the calendar (real upcoming items), not a fake badge. */}
          <Link
            href="/calendar"
            aria-label={t.topbar.notifications}
            className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-white/5"
          >
            <Bell className="h-5 w-5" />
          </Link>

          {/* Profile — owner identity comes from the environment; local single-user
              mode shows a neutral monogram (spec §07: no invented people). */}
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-raised)] text-xs font-semibold text-[var(--gold-light)]"
            title={t.topbar.profile}
          >
            GP
          </div>
        </header>

        <main id="gp-main" className="min-w-0 flex-1">
          {children}
        </main>

        <footer className="border-t border-[var(--border-subtle)] px-4 py-3 text-[11px] text-[var(--text-muted)]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
            <span>
              <span className="font-wordmark font-semibold text-[var(--gold-deep)]">Galstyan&amp;Partners</span>
              {" · v1.0 · "}
              {t.brand.confidential}
            </span>
            <span>Աղբյուրներ՝ ARLIS.am · Datalex.am · Concourt.am</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** True for routes that render the representative (marble/Themis) hero. */
export function isRepresentativeRoute(pathname: string): boolean {
  return pathname === "/" || pathname === "/search";
}
