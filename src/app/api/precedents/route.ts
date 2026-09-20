// GET /api/precedents — distinct precedent citations linked to case issues
// (the "saved practice" KPI drill-down).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.legalIssueLink.findMany({
    where: { relatedPrecedents: { not: "[]" } },
    select: { relatedPrecedents: true, caseId: true, case: { select: { title: true } } },
    take: 200,
  });

  const seen = new Set<string>();
  const saved: { citation: string; source: string; caseTitle: string; caseId: string }[] = [];
  for (const row of rows) {
    try {
      const arr = JSON.parse(row.relatedPrecedents) as { citation?: string; source?: string }[];
      for (const p of arr) {
        if (!p?.citation) continue;
        const key = `${p.source ?? ""}|${p.citation}`;
        if (seen.has(key)) continue;
        seen.add(key);
        saved.push({
          citation: p.citation,
          source: p.source ?? "unknown",
          caseTitle: row.case?.title ?? "—",
          caseId: row.caseId,
        });
      }
    } catch {
      /* skip malformed */
    }
  }

  return NextResponse.json({ saved });
}
