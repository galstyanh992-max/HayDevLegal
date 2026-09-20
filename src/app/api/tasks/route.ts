// Tasks CRUD — /api/tasks (GET list, POST create) + /api/tasks/[id] (PATCH).
// Status transitions are explicit; overdue is computed from dueAt+status, never stored.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

const CreateTask = z.object({
  title: z.string().trim().min(1).max(240),
  description: z.string().max(4000).optional(),
  caseId: z.string().max(64).optional(),
  assignee: z.string().max(120).optional(),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  dueAt: z.string().datetime({ offset: true }).optional(),
});

const PatchTask = z.object({
  title: z.string().trim().min(1).max(240).optional(),
  description: z.string().max(4000).nullable().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const caseId = url.searchParams.get("caseId");
  const take = Math.min(100, Number(url.searchParams.get("take") ?? 50) || 50);

  const tasks = await db.task.findMany({
    where: {
      ...(status && (TASK_STATUSES as readonly string[]).includes(status) ? { status } : {}),
      ...(caseId ? { caseId } : {}),
    },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    take,
    include: { case: { select: { title: true } } },
  });

  return NextResponse.json({
    tasks: tasks.map((t) => ({
      ...t,
      overdue:
        t.dueAt != null &&
        t.dueAt.getTime() < Date.now() &&
        (t.status === "TODO" || t.status === "IN_PROGRESS"),
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = CreateTask.parse(await req.json().catch(() => null));
    if (body.caseId) {
      const exists = await db.caseWorkspace.findUnique({ where: { id: body.caseId }, select: { id: true } });
      if (!exists) return NextResponse.json({ error: "case not found" }, { status: 400 });
    }
    const task = await db.task.create({
      data: {
        title: body.title,
        description: body.description,
        caseId: body.caseId,
        assignee: body.assignee,
        priority: body.priority,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
      },
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "validation", issues: e.issues.slice(0, 5) }, { status: 400 });
    }
    return NextResponse.json({ error: "failed to create task" }, { status: 500 });
  }
}
