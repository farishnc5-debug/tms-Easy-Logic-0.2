"use server";

import { revalidatePath } from "next/cache";
import { requireCapability } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export async function createDriver(formData: FormData) {
  await requireCapability("operate");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const licenseNumber = String(formData.get("licenseNumber") ?? "").trim();
  const status = String(formData.get("status") ?? "AVAILABLE");
  const vehicleId = String(formData.get("vehicleId") ?? "") || null;

  if (!name || !phone || !licenseNumber) throw new Error("Name, phone and license are required.");

  const driver = await db.driver.create({
    data: { name, phone, email, licenseNumber, status, vehicleId },
  });

  revalidatePath("/drivers");
  redirect(`/drivers/${driver.id}`);
}

export async function updateDriver(id: string, formData: FormData) {
  await requireCapability("operate");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const licenseNumber = String(formData.get("licenseNumber") ?? "").trim();
  const status = String(formData.get("status") ?? "AVAILABLE");
  const vehicleId = String(formData.get("vehicleId") ?? "") || null;

  await db.driver.update({
    where: { id },
    data: { name, phone, email, licenseNumber, status, vehicleId },
  });

  revalidatePath("/drivers");
  revalidatePath(`/drivers/${id}`);
  redirect(`/drivers/${id}`);
}

export async function deleteDriver(id: string) {
  await requireCapability("operate");
  await db.trip.updateMany({ where: { driverId: id }, data: { driverId: null } });
  await db.driver.delete({ where: { id } });
  revalidatePath("/drivers");
  redirect("/drivers");
}
