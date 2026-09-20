// GET /api/dashboard — real aggregates for the home panel (spec §07).
// Every number is a SQL count over the actual store. Zero means zero;
// a failed section degrades independently ("unavailable"), never faked.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(section: string, e: unknown) {
  return { error: `${section}: ${e instanceof Error ? e.message : String(e)}` };
}

export async function GET() {
  // KPIs — each guarded so one failure can't blank the whole panel.
  const [activeCases, documents, savedPrecedents, upcomingHearings] =
    await Promise.allSettled([
      db.caseWorkspace.count({ where: { status: "ACTIVE" } }),
      db.caseDocument.count(),
      // Saved practice = distinct precedent citations linked to case issues.
      db.legalIssueLink.findMany({
        select: { relatedPrecedents: true },
        where: { relatedPrecedents: { not: "[]" } },
      }).then((rows) => {
        const seen = new Set<string>();
        for (const row of rows) {
          try {
            const arr = JSON.parse(row.relatedPrecedents) as { citation?: string; source?: string }[];
            for (const p of arr) {
              if (p?.citation) seen.add(`${p.source ?? ""}|${p.citation}`);
            }
          } catch {
            /* skip malformed row */
          }
        }
        return seen.size;
      }),
      // Upcoming HEARING events in the next 7 days, excluding cancelled.
      db.calendarEvent.findMany({
        where: {
          type: "HEARING",
          status: { not: "CANCELLED" },
          startsAt: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 3600 * 1000) },
        },
        select: { id: true },
      }).then((rows) => rows.length),
    ]);

  const kpiValue = (r: PromiseSettledResult<unknown>) =>
    r.status === "fulfilled" ? { value: r.value as number, available: true } : { value: null, available: false };

  // Recent cases — from RecentView history, latest view per case, max 5.
  const recent = await db.recentView
    .findMany({
      orderBy: { viewedAt: "desc" },
      take: 40,
      select: {
        caseId: true,
        viewedAt: true,
        case: { select: { id: true, title: true, caseType: true, status: true } },
      },
    })
    .then((rows) => {
      const seen = new Set<string>();
      const out: { id: string; title: string; caseType: string; viewedAt: string }[] = [];
      for (const r of rows) {
        if (seen.has(r.caseId) || !r.case) continue;
        seen.add(r.caseId);
        out.push({ id: r.case.id, title: r.case.title, caseType: r.case.caseType, viewedAt: r.viewedAt.toISOString() });
        if (out.length >= 5) break;
      }
      return out;
    })
    .catch(() => null);

  // Today — hearings/tasks/deadlines in Asia/Yerevan "today" window.
  const today = await (async () => {
    try {
      // Yerevan is UTC+4 fixed (no DST) — compute the local day boundaries.
      const nowUtc = Date.now();
      const yerevanNow = new Date(nowUtc + 4 * 3600 * 1000);
      const dayStartUtc = Date.UTC(
        yerevanNow.getUTCFullYear(), yerevanNow.getUTCMonth(), yerevanNow.getUTCDate(),
        0, 0, 0,
      ) - 4 * 3600 * 1000;
      const dayEndUtc = dayStartUtc + 24 * 3600 * 1000;

      const events = await db.calendarEvent.findMany({
        where: {
          status: { not: "CANCELLED" },
          OR: [
            { startsAt: { gte: new Date(dayStartUtc), lt: new Date(dayEndUtc) } },
            { allDay: true, dateOnly: new Date(dayStartUtc + 4 * 3600 * 1000).toISOString().slice(0, 10) },
          ],
        },
        orderBy: { startsAt: "asc" },
        take: 20,
        select: {
          id: true, type: true, title: true, startsAt: true, allDay: true,
          dateOnly: true, location: true, caseId: true,
          case: { select: { title: true } },
        },
      });

      const tasks = await db.task.findMany({
        where: {
          status: { in: ["TODO", "IN_PROGRESS"] },
          OR: [
            { dueAt: { gte: new Date(dayStartUtc), lt: new Date(dayEndUtc) } },
            { dueAt: null },
          ],
        },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        take: 10,
        select: { id: true, title: true, priority: true, dueAt: true, caseId: true },
      });

      return { available: true as const, events, tasks };
    } catch (e) {
      return { available: false as const, error: jsonError("today", e) };
    }
  })();

  return NextResponse.json({
    ts: new Date().toISOString(),
    kpis: {
      activeCases: kpiValue(activeCases),
      documents: kpiValue(documents),
      savedPrecedents: kpiValue(savedPrecedents),
      upcomingHearings: kpiValue(upcomingHearings),
    },
    recentCases: recent, // null = unavailable
    today,
  });
}
