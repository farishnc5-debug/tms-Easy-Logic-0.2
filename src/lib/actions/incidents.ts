"use server";

import { revalidatePath } from "next/cache";
import { requireCapability } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function createIncident(formData: FormData) {
  await requireCapability("field");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const severity = String(formData.get("severity") ?? "MEDIUM");
  const tripId = String(formData.get("tripId") ?? "") || null;

  if (!title || !description) throw new Error("Title and description are required.");

  const user = await getCurrentUser();

  await db.incident.create({
    data: { title, description, severity, tripId, reportedById: user?.id },
  });

  if (tripId) {
    const trip = await db.trip.findUnique({ where: { id: tripId } });
    await db.alert.create({
      data: {
        type: "INCIDENT",
        message: `${title}${trip ? ` on trip ${trip.code}` : ""}`,
        severity: severity === "CRITICAL" || severity === "HIGH" ? "CRITICAL" : "WARNING",
        tripId,
      },
    });
  }

  revalidatePath("/incidents");
  redirect("/incidents");
}

export async function updateIncidentStatus(id: string, status: string) {
  await requireCapability("field");
  await db.incident.update({
    where: { id },
    data: { status, resolvedAt: status === "RESOLVED" ? new Date() : null },
  });
  revalidatePath("/incidents");
}

export async function deleteIncident(id: string) {
  await requireCapability("operate");
  await db.incident.delete({ where: { id } });
  revalidatePath("/incidents");
  redirect("/incidents");
}
