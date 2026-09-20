"use client";

// /cases/[id] — deep link into the case workspace with the case pre-opened.

import { use } from "react";
import { CaseWorkspace } from "@/components/case-workspace/CaseWorkspace";

export default function CaseByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <CaseWorkspace initialCaseId={id} />
    </div>
  );
}
