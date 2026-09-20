// GET /api/analytics — real aggregate counts for the analytics page.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [byType, byStatus, documents, analysisRuns, drafts] = await Promise.all([
    db.caseWorkspace.groupBy({ by: ["caseType"], _count: { _all: true } }),
    db.caseWorkspace.groupBy({ by: ["status"], _count: { _all: true } }),
    db.caseDocument.count(),
    db.caseAnalysisResult.count(),
    db.legalDraft.count(),
  ]);

  return NextResponse.json({
    available: true,
    byType: byType.map((x) => ({ caseType: x.caseType, count: x._count._all })),
    byStatus: byStatus.map((x) => ({ status: x.status, count: x._count._all })),
    documents,
    analysisRuns,
    drafts,
  });
}
