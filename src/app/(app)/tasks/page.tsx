import { ClipboardList } from "lucide-react";
import { db } from "@/lib/db";
import { createTask } from "@/lib/actions/tasks";
import TaskCard from "@/components/tasks/task-card";

export const dynamic = "force-dynamic";

const COLUMNS = [
  { key: "PENDING", label: "Pending" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "DONE", label: "Done" },
];

export default async function TasksPage() {
  const [tasks, trips] = await Promise.all([
    db.task.findMany({ include: { relatedTrip: true }, orderBy: { createdAt: "desc" } }),
    db.trip.findMany({
      where: { status: { in: ["DISPATCHED", "COLLECTING", "IN_TRANSIT", "AT_DELIVERY", "DELAYED"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const rows = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueAt: t.dueAt?.toISOString() ?? null,
    tripCode: t.relatedTrip?.code ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-400">
          <ClipboardList size={14} /> NEW TASK
        </p>
        <form action={createTask} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <input
            name="title"
            required
            placeholder="Task title"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 sm:col-span-2"
          />
          <select name="priority" defaultValue="MEDIUM" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <select name="relatedTripId" defaultValue="" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400">
            <option value="">No trip</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code}
              </option>
            ))}
          </select>
          <input type="date" name="dueAt" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 sm:col-span-5">
            Add Task
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colTasks = rows.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-xs font-semibold tracking-widest text-slate-500">{col.label}</p>
                <span className="text-xs text-slate-400">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
                {colTasks.length === 0 && (
                  <p className="px-2 py-6 text-center text-xs text-slate-400">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
