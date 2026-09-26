import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Polled by the global AlarmWatcher every ~20s. Returns any alarm that is
// due right now: PENDING with triggerAt in the past, or SNOOZED with
// snoozedUntil in the past.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const now = new Date();
  const due = await db.shipmentAlarm.findFirst({
    where: {
      OR: [
        { status: "PENDING", triggerAt: { lte: now } },
        { status: "SNOOZED", snoozedUntil: { lte: now } },
      ],
    },
    orderBy: { triggerAt: "asc" },
    include: { shipment: { select: { code: true, originName: true, destinationName: true } } },
  });

  if (!due) return NextResponse.json({ alarm: null });

  return NextResponse.json({
    alarm: {
      id: due.id,
      shipmentId: due.shipmentId,
      shipmentCode: due.shipment.code,
      route: `${due.shipment.originName} → ${due.shipment.destinationName}`,
      label: due.label,
      triggerAt: due.triggerAt,
    },
  });
}
