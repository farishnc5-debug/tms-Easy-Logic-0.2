"use server";

import { revalidatePath } from "next/cache";
import { requireCapability } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export async function createVehicle(formData: FormData) {
  await requireCapability("operate");
  const plateNumber = String(formData.get("plateNumber") ?? "").trim();
  const vehicleType = String(formData.get("vehicleType") ?? "").trim();
  const capacityTon = formData.get("capacityTon") ? Number(formData.get("capacityTon")) : null;
  const status = String(formData.get("status") ?? "AVAILABLE");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!plateNumber || !vehicleType) throw new Error("Plate number and type are required.");

  const vehicle = await db.vehicle.create({
    data: { plateNumber, vehicleType, capacityTon: capacityTon ?? undefined, status, notes },
  });

  revalidatePath("/fleet");
  redirect(`/fleet/${vehicle.id}`);
}

export async function updateVehicle(id: string, formData: FormData) {
  await requireCapability("operate");
  const plateNumber = String(formData.get("plateNumber") ?? "").trim();
  const vehicleType = String(formData.get("vehicleType") ?? "").trim();
  const capacityTon = formData.get("capacityTon") ? Number(formData.get("capacityTon")) : null;
  const status = String(formData.get("status") ?? "AVAILABLE");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await db.vehicle.update({
    where: { id },
    data: { plateNumber, vehicleType, capacityTon: capacityTon ?? undefined, status, notes },
  });

  revalidatePath("/fleet");
  revalidatePath(`/fleet/${id}`);
  redirect(`/fleet/${id}`);
}

export async function deleteVehicle(id: string) {
  await requireCapability("operate");
  await db.driver.updateMany({ where: { vehicleId: id }, data: { vehicleId: null } });
  await db.vehicle.delete({ where: { id } });
  revalidatePath("/fleet");
  redirect("/fleet");
}
