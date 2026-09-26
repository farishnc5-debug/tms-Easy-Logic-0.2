"use server";

import { revalidatePath } from "next/cache";
import { requireCapability } from "@/lib/rbac";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function createTask(formData: FormData) {
  await requireCapability("operate");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const priority = String(formData.get("priority") ?? "MEDIUM");
  const dueAt = formData.get("dueAt") ? new Date(String(formData.get("dueAt"))) : null;
  const relatedTripId = String(formData.get("relatedTripId") ?? "") || null;

  if (!title) throw new Error("Title is required.");

  const user = await getCurrentUser();
  await db.task.create({
    data: { title, description, priority, dueAt, relatedTripId, assignedToId: user?.id },
  });

  revalidatePath("/tasks");
}

export async function updateTaskStatus(id: string, status: string) {
  await requireCapability("field");
  await db.task.update({ where: { id }, data: { status } });
  revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
  await requireCapability("operate");
  await db.task.delete({ where: { id } });
  revalidatePath("/tasks");
}
