"use client";

// /cases — case workspace (list + detail). Focus mode. Opening a case
// syncs the URL to /cases/[id] (deep-linkable, back/forward safe).

import { useEffect } from "react";
import { CaseWorkspace } from "@/components/case-workspace/CaseWorkspace";
import { usePathname, useRouter } from "next/navigation";

export default function CasesPage() {
  const router = useRouter();
  const pathname = usePathname();

  // When the workspace opens a case, replace the URL so the view is shareable.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ caseId: string | null }>).detail;
      const target = detail?.caseId ? `/cases/${detail.caseId}` : "/cases";
      if (pathname !== target) window.history.replaceState({}, "", target);
    };
    window.addEventListener("gp:case-opened", handler);
    return () => window.removeEventListener("gp:case-opened", handler);
  }, [pathname]);

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <CaseWorkspace />
    </div>
  );
}
