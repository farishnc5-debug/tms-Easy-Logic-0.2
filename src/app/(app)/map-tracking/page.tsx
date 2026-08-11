import { db } from "@/lib/db";
import MapTrackingBoard from "@/components/map/map-tracking-board";
import { getCurrentVehicleLocations } from "@/lib/actions/gps";

export const dynamic = "force-dynamic";

export default async function MapTrackingPage() {
  const trips = await db.trip.findMany({
    where: {
      status: {
        in: [
          "DISPATCHED",
          "COLLECTING",
          "IN_TRANSIT",
          "AT_DELIVERY",
          "DELAYED",
          "RETURN_TRANSIT",
          "AT_RETURN",
        ],
      },
    },
    include: { driver: true, vehicle: true, shipment: { include: { customer: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const tripRows = trips.map((t) => ({
    id: t.id,
    code: t.code,
    shipmentId: t.shipmentId,
    shipmentCode: t.shipment.code,
    customerName: t.shipment.customer.name,
    originName: t.originName,
    destinationName: t.destinationName,
    originX: t.originX,
    originY: t.originY,
    destX: t.destX,
    destY: t.destY,
    currentX: t.currentX,
    currentY: t.currentY,
    status: t.status,
    statusNote: t.statusNote,
    progressPct: t.progressPct,
    distanceKm: t.distanceKm,
    departureAt: t.departureAt?.toISOString() ?? null,
    etaAt: t.etaAt?.toISOString() ?? null,
    driverName: t.driver?.name ?? null,
    driverPhone: t.driver?.phone ?? null,
    vehiclePlate: t.vehicle?.plateNumber ?? null,
  }));

  // Fetch live GPS vehicle positions
  const gpsLocations = await getCurrentVehicleLocations();

  return (
    <MapTrackingBoard
      trips={tripRows}
      gpsLocations={gpsLocations}
    />
  );
}
