// POST /api/recent — record that the user opened a case (feeds «Недавние дела»).
// One RecentView per case: the newest view replaces the previous entry.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { caseId?: string } | null;
    if (!body?.caseId) return NextResponse.json({ error: "caseId required" }, { status: 400 });
    const exists = await db.caseWorkspace.findUnique({ where: { id: body.caseId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "case not found" }, { status: 404 });

    await db.recentView.deleteMany({ where: { caseId: body.caseId } });
    const view = await db.recentView.create({ data: { caseId: body.caseId } });
    return NextResponse.json({ view }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "failed to record view" }, { status: 500 });
  }
}
