"use client";

// /collaboration — local single-user deployment: honest state (spec §13:
// "можно показывать реального владельца и понятное состояние").

import { Users } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

export default function CollaborationPage() {
  const { t } = useLocale();
  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
        <Users className="h-5 w-5 text-[var(--gold-primary)]" /> {t.nav.collaboration}
      </h1>
      <div className="gp-glass p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-active)] bg-[var(--surface-raised)] text-sm font-semibold text-[var(--gold-light)]">
            GP
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)]">Galstyan & Partners</div>
            <div className="text-[12px] text-[var(--text-muted)]">{t.common.owner} · local workspace</div>
          </div>
        </div>
        <hr className="my-5 border-[var(--border-subtle)]" />
        <p className="text-sm text-[var(--text-secondary)]">{t.common.collaborationOffline}.</p>
        <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-muted)]">
          Այս տեղադրումը աշխատում է տեղային single-user ռեժիմով։ Մասնակիցների հրավերը,
          դերերը և գործերի հասանելիության կառավարումը միացվում են առանձին
          կազմաձևմամբ՝ առանց տվյալների կորստի։
        </p>
      </div>
    </div>
  );
}
