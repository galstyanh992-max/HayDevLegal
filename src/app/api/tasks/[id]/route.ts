// PATCH /api/tasks/[id] — status transitions, edits. completedAt is set by the
// server on DONE and cleared when leaving DONE (never client-supplied).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchTask = z.object({
  title: z.string().trim().min(1).max(240).optional(),
  description: z.string().max(4000).nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = PatchTask.parse(await req.json().catch(() => null));

    const existing = await db.task.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.dueAt !== undefined) data.dueAt = body.dueAt ? new Date(body.dueAt) : null;
    if (body.status !== undefined) {
      data.status = body.status;
      data.completedAt = body.status === "DONE" ? new Date() : null;
    }

    const task = await db.task.update({ where: { id }, data });
    return NextResponse.json({ task });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "validation", issues: e.issues.slice(0, 5) }, { status: 400 });
    }
    return NextResponse.json({ error: "failed to update task" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const existing = await db.task.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  await db.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
