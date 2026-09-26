"use server";

import { revalidatePath } from "next/cache";
import { requireCapability } from "@/lib/rbac";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function setShipmentAlarm(shipmentId: string, formData: FormData) {
  await requireCapability("operate");
  const user = await getCurrentUser();
  const triggerAtRaw = String(formData.get("triggerAt") ?? "");
  const label = String(formData.get("label") ?? "").trim() || null;
  if (!triggerAtRaw) throw new Error("Pick a date and time for the alarm.");
  const triggerAt = new Date(triggerAtRaw);
  if (Number.isNaN(triggerAt.getTime())) throw new Error("Invalid date/time.");

  const shipment = await db.shipment.findUnique({ where: { id: shipmentId }, select: { code: true } });
  await db.shipmentAlarm.create({
    data: { shipmentId, triggerAt, label, createdById: user?.id ?? null },
  });
  await logAudit({
    action: "SHIPMENT_ALARM_SET",
    entity: "Shipment",
    entityId: shipmentId,
    entityRef: shipment?.code,
    after: { triggerAt: triggerAt.toISOString(), label },
  });
  revalidatePath(`/shipments/${shipmentId}`);
}

export async function snoozeAlarm(id: string, minutes: number) {
  await requireCapability("read");
  const snoozedUntil = new Date(Date.now() + minutes * 60_000);
  const alarm = await db.shipmentAlarm.update({
    where: { id },
    data: { status: "SNOOZED", snoozedUntil },
    include: { shipment: { select: { id: true, code: true } } },
  });
  revalidatePath(`/shipments/${alarm.shipment.id}`);
  return alarm;
}

export async function dismissAlarm(id: string) {
  await requireCapability("read");
  const alarm = await db.shipmentAlarm.update({
    where: { id },
    data: { status: "DISMISSED" },
    include: { shipment: { select: { id: true, code: true } } },
  });
  await logAudit({
    action: "SHIPMENT_ALARM_DISMISSED",
    entity: "Shipment",
    entityId: alarm.shipment.id,
    entityRef: alarm.shipment.code,
  });
  revalidatePath(`/shipments/${alarm.shipment.id}`);
  return alarm;
}

export async function clearAlarm(id: string, shipmentId: string) {
  await requireCapability("operate");
  await db.shipmentAlarm.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/shipments/${shipmentId}`);
}
