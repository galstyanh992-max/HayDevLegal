// Cross-case document library — GET /api/documents (real rows, no fakes).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const caseId = url.searchParams.get("caseId");
  const take = Math.min(200, Number(url.searchParams.get("take") ?? 100) || 100);

  const documents = await db.caseDocument.findMany({
    where: {
      ...(caseId ? { caseId } : {}),
      ...(q
        ? {
            OR: [
              { originalFilename: { contains: q } },
              { displayName: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      caseId: true,
      displayName: true,
      originalFilename: true,
      documentType: true,
      pageCount: true,
      processingStatus: true,
      sizeBytes: true,
      createdAt: true,
      case: { select: { title: true } },
    },
  });

  return NextResponse.json({ documents });
}

export async function POST() {
  return NextResponse.json({ error: "use /api/documents/upload within a case" }, { status: 405 });
}
