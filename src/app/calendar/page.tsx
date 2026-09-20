"use client";

// /calendar — real events + tasks (CalendarEvent / Task tables).
// All-day events carry a calendar dateOnly; timed events show in Asia/Yerevan.

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Plus, RefreshCw } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

interface Ev {
  id: string; type: string; title: string; startsAt: string | null;
  allDay: boolean; dateOnly: string | null; status: string;
  case?: { title: string } | null;
}
interface Tk {
  id: string; title: string; status: string; priority: string;
  dueAt: string | null; overdue?: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  HEARING: "Դատական նիստ", MEETING: "Հանդիպում", DEADLINE: "Ժամկետ", REMINDER: "Հիշեցում",
};

export default function CalendarPage() {
  const { t } = useLocale();
  const [events, setEvents] = useState<Ev[] | null>(null);
  const [tasks, setTasks] = useState<Tk[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("HEARING");
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const [e, tk] = await Promise.all([
        fetch("/api/calendar").then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))),
        fetch("/api/tasks?take=50").then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))),
      ]);
      setEvents(e.events);
      setTasks(tk.tasks);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    // Deferred initial fetch (no synchronous setState from the effect body).
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const createEvent = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const body: Record<string, unknown> = { title: title.trim(), type, timezone: "Asia/Yerevan" };
      if (when) {
        body.startsAt = new Date(when).toISOString();
      } else {
        body.allDay = true;
        body.dateOnly = new Date().toISOString().slice(0, 10);
      }
      await fetch("/api/calendar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      setTitle(""); setWhen("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const toggleTask = async (task: Tk) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: task.status === "DONE" ? "TODO" : "DONE" }),
    });
    await load();
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
        <CalendarDays className="h-5 w-5 text-[var(--gold-primary)]" /> {t.nav.calendar}
        <span className="text-[12px] font-normal text-[var(--text-muted)]">Asia/Yerevan</span>
      </h1>

      {failed && (
        <div className="gp-glass mb-4 flex items-center gap-2 p-4 text-sm text-[var(--warning)]">
          <RefreshCw className="h-4 w-4" /> {t.home.kpi.unavailable}
          <button type="button" className="underline" onClick={() => void load()}>{t.home.kpi.retry}</button>
        </div>
      )}

      {/* Create event */}
      <form
        className="gp-glass mb-5 flex flex-wrap items-center gap-2 p-3"
        onSubmit={(e) => { e.preventDefault(); void createEvent(); }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.home.today.newEvent}
          aria-label={t.home.today.newEvent}
          className="h-9 min-w-[180px] flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 text-sm outline-none focus:border-[var(--border-active)]"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Type"
          className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-input)] px-2 text-sm"
        >
          <option value="HEARING">{TYPE_LABEL.HEARING}</option>
          <option value="MEETING">{TYPE_LABEL.MEETING}</option>
          <option value="DEADLINE">{TYPE_LABEL.DEADLINE}</option>
          <option value="REMINDER">{TYPE_LABEL.REMINDER}</option>
        </select>
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          aria-label="When"
          className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-input)] px-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="gp-gold-cta inline-flex h-9 items-center gap-1 rounded-full px-4 text-sm font-semibold disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> {t.home.today.newEvent}
        </button>
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Events */}
        <div className="gp-glass p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{t.nav.calendar}</h2>
          {events === null && !failed && <div className="h-20 animate-pulse rounded bg-white/5" />}
          {events != null && events.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">{t.home.today.empty}</p>
          )}
          <ul className="space-y-2">
            {events?.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] px-3 py-2">
                <span className="rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--gold-light)]">
                  {TYPE_LABEL[e.type] ?? e.type}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-[var(--text-primary)]">{e.title}</span>
                  <span className="text-[11px] tabular-nums text-[var(--text-muted)]">
                    {e.allDay || !e.startsAt
                      ? e.dateOnly ?? "—"
                      : new Date(e.startsAt).toLocaleString("hy-AM", { dateStyle: "short", timeStyle: "short" })}
                    {e.case?.title ? ` · ${e.case.title}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tasks */}
        <div className="gp-glass p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{t.home.today.task}</h2>
          {tasks === null && !failed && <div className="h-20 animate-pulse rounded bg-white/5" />}
          {tasks != null && tasks.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">{t.home.kpi.empty}</p>
          )}
          <ul className="space-y-1.5">
            {tasks?.map((task) => (
              <li key={task.id} className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-3 py-2">
                <input
                  type="checkbox"
                  checked={task.status === "DONE"}
                  onChange={() => void toggleTask(task)}
                  aria-label={task.title}
                  className="h-4 w-4 accent-[var(--gold-primary)]"
                />
                <span className={`min-w-0 flex-1 truncate text-sm ${task.status === "DONE" ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"}`}>
                  {task.title}
                  {task.overdue && <span className="ml-2 text-[11px] text-[var(--danger)]">overdue</span>}
                </span>
                <span className="shrink-0 rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                  {task.priority}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
