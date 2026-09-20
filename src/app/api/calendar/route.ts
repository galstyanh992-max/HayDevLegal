// Calendar events — GET (range query, Yerevan default), POST create.
// All-day events carry dateOnly (YYYY-MM-DD); timed events carry UTC instants.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENT_TYPES = ["HEARING", "MEETING", "DEADLINE", "REMINDER"] as const;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const CreateEvent = z
  .object({
    title: z.string().trim().min(1).max(240),
    type: z.enum(EVENT_TYPES).default("MEETING"),
    caseId: z.string().max(64).optional(),
    allDay: z.boolean().default(false),
    // ISO datetime with offset for timed events; YYYY-MM-DD for all-day.
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    dateOnly: z.string().optional(),
    timezone: z.string().max(64).default("Asia/Yerevan"),
    location: z.string().max(240).optional(),
    notes: z.string().max(4000).optional(),
  })
  .refine((v) => (v.allDay ? DATE_ONLY.test(v.dateOnly ?? "") : Boolean(v.startsAt)), {
    message: "allDay requires dateOnly (YYYY-MM-DD); timed event requires startsAt",
  })
  .refine((v) => !v.startsAt || !v.endsAt || new Date(v.endsAt) > new Date(v.startsAt), {
    message: "endsAt must be after startsAt",
  });

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const caseId = url.searchParams.get("caseId");
  const take = Math.min(200, Number(url.searchParams.get("take") ?? 100) || 100);

  const events = await db.calendarEvent.findMany({
    where: {
      ...(caseId ? { caseId } : {}),
      ...(from && to
        ? { startsAt: { gte: new Date(from), lte: new Date(to) } }
        : {}),
    },
    orderBy: { startsAt: "asc" },
    take,
    include: { case: { select: { title: true } } },
  });

  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  try {
    const body = CreateEvent.parse(await req.json().catch(() => null));
    if (body.caseId) {
      const exists = await db.caseWorkspace.findUnique({ where: { id: body.caseId }, select: { id: true } });
      if (!exists) return NextResponse.json({ error: "case not found" }, { status: 400 });
    }
    const event = await db.calendarEvent.create({
      data: {
        title: body.title,
        type: body.type,
        caseId: body.caseId,
        allDay: body.allDay,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        dateOnly: body.allDay ? body.dateOnly : null,
        timezone: body.timezone,
        location: body.location,
        notes: body.notes,
      },
    });
    return NextResponse.json({ event }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "validation", issues: e.issues.slice(0, 5) }, { status: 400 });
    }
    return NextResponse.json({ error: "failed to create event" }, { status: 500 });
  }
}
