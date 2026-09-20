"use client";

// /assistant — the legal AI assistant: reuses the real search + answer stack
// (no new provider surface). Typing a question runs a quick search and opens
// the AI answer layer below the sources.

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

export default function AssistantPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [q, setQ] = useState("");

  const ask = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      // Deep mode → sources + research + AI answer with citations.
      router.push(`/search?q=${encodeURIComponent(trimmed)}&mode=deep`);
    },
    [router],
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <BrainCircuit className="h-8 w-8 text-[var(--gold-primary)]" />
        <h1 className="font-wordmark text-2xl font-semibold text-[var(--text-primary)]">
          {t.nav.assistant}
        </h1>
      </div>
      <p className="mb-6 text-center text-sm text-[var(--text-secondary)]">
        {t.home.cards.assistantSub} — ARLIS · Datalex · ConCourt · ՄԻԵԴ
      </p>
      <form
        className="flex w-full items-center gap-2 rounded-full border border-[var(--border-active)] bg-[var(--surface-input)] p-2 pl-5"
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.home.searchPlaceholder}
          aria-label={t.nav.search}
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--text-muted)]"
        />
        <button
          type="submit"
          aria-label={t.home.searchAction}
          className="gp-gold-cta flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>
      <p className="mt-4 text-[12px] text-[var(--text-muted)]">
        Հարցը ուղարկվում է իրավական որոնման՝ աղբյուրների ստուգմամբ (closed-evidence)։
      </p>
    </div>
  );
}
