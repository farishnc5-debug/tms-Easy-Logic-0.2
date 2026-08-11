"use client";

import { STATUS_BADGE_CLASSES } from "@/lib/constants";
import { useT } from "@/components/layout/locale-provider";

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const t = useT();
  const cls = STATUS_BADGE_CLASSES[status] ?? "bg-gray-100 text-gray-600 ring-gray-500/20";
  const text = label ?? t(status.replace(/_/g, " "));
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${cls}`}
    >
      {text}
    </span>
  );
}

export function Pill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}
