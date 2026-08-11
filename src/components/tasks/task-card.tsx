"use client";

import { useTransition } from "react";
import { Trash2, Clock } from "lucide-react";
import { updateTaskStatus, deleteTask } from "@/lib/actions/tasks";
import { Pill } from "@/components/ui/badge";

const NEXT: Record<string, string | null> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: null,
};

const NEXT_LABEL: Record<string, string> = {
  PENDING: "Start",
  IN_PROGRESS: "Complete",
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-500",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-red-50 text-red-700",
};

export default function TaskCard({
  task,
}: {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueAt: string | null;
    tripCode: string | null;
  };
}) {
  const [pending, startTransition] = useTransition();
  const next = NEXT[task.status];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">{task.title}</p>
        <button
          disabled={pending}
          onClick={() => startTransition(() => deleteTask(task.id))}
          className="shrink-0 text-slate-300 hover:text-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {task.description && <p className="mb-2 text-xs text-slate-500">{task.description}</p>}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Pill className={PRIORITY_COLOR[task.priority]}>{task.priority}</Pill>
        {task.tripCode && <Pill className="bg-sky-50 text-sky-700">{task.tripCode}</Pill>}
        {task.dueAt && (
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Clock size={11} /> {new Date(task.dueAt).toLocaleDateString()}
          </span>
        )}
      </div>
      {next && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => updateTaskStatus(task.id, next))}
          className="w-full rounded-md bg-slate-900 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {NEXT_LABEL[task.status]}
        </button>
      )}
    </div>
  );
}
