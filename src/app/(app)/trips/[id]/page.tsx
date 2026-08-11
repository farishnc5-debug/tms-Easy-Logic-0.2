import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, AlertTriangle, FileText } from "lucide-react";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import CycleStepper from "@/components/dashboard/cycle-stepper";
import LiveMap from "@/components/map/live-map";
import StatusControls from "@/components/trips/status-controls";
import ReassignForm from "@/components/trips/reassign-form";
import AllowanceCard from "@/components/trips/allowance-card";
import { fmtDateTime } from "@/lib/format";
import { stageOfStatus } from "@/lib/constants";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const trip = await db.trip.findUnique({
    where: { id },
    include: {
      driver: true,
      vehicle: true,
      shipment: { include: { customer: true, settlement: true } },
      incidents: true,
      documents: true,
    },
  });
  if (!trip) notFound();

  const [drivers, vehicles] = await Promise.all([
    db.driver.findMany({
      where: { OR: [{ status: "AVAILABLE" }, { id: trip.driverId ?? undefined }] },
      orderBy: { name: "asc" },
    }),
    db.vehicle.findMany({
      where: { OR: [{ status: "AVAILABLE" }, { id: trip.vehicleId ?? undefined }] },
      orderBy: { plateNumber: "asc" },
    }),
  ]);

  const currentStage = stageOfStatus(trip.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/trips" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={15} /> Back to Trips
        </Link>
        <Link
          href={`/shipments/${trip.shipmentId}`}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          View Shipment {trip.shipment.code} →
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-slate-900">{trip.code}</h2>
        <StatusBadge status={trip.status} />
      </div>

      <CycleStepper
        currentStage={currentStage}
        tripType={trip.shipment.tripType}
        timestamps={{
          dispatchedAt: trip.dispatchedAt,
          collectingAt: trip.collectingAt,
          inTransitAt: trip.inTransitAt,
          atDeliveryAt: trip.atDeliveryAt,
          deliveredAt: trip.deliveredAt,
          leftDeliveryAt: trip.leftDeliveryAt,
          returnTransitAt: trip.returnTransitAt,
          atReturnAt: trip.atReturnAt,
          returnOffloadedAt: trip.returnOffloadedAt,
        }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-widest text-slate-400">LIVE MAP</p>
              <StatusControls
                tripId={trip.id}
                status={trip.status}
                tripType={trip.shipment.tripType}
                delayedFrom={trip.delayedFrom}
              />
            </div>
            <LiveMap
              trips={[
                {
                  id: trip.id,
                  code: trip.code,
                  originName: trip.originName,
                  destinationName: trip.destinationName,
                  originX: trip.originX,
                  originY: trip.originY,
                  destX: trip.destX,
                  destY: trip.destY,
                  returnName: trip.returnName,
                  returnX: trip.returnX,
                  returnY: trip.returnY,
                  currentX: trip.currentX,
                  currentY: trip.currentY,
                  status: trip.status,
                },
              ]}
              selectedTripId={trip.id}
              height={300}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
              REASSIGN DRIVER / VEHICLE
            </p>
            <ReassignForm
              tripId={trip.id}
              currentDriverId={trip.driverId}
              currentVehicleId={trip.vehicleId}
              drivers={drivers}
              vehicles={vehicles}
            />
          </div>

          {trip.incidents.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">INCIDENTS</p>
              <ul className="space-y-2">
                {trip.incidents.map((inc) => (
                  <li key={inc.id} className="flex items-start gap-2 text-sm">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-700">{inc.title}</p>
                      <p className="text-xs text-slate-400">{inc.description}</p>
                    </div>
                    <StatusBadge status={inc.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-widest text-slate-400">DOCUMENTS</p>
              <Link href={`/documents?tripId=${trip.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                Manage →
              </Link>
            </div>
            {trip.documents.length === 0 ? (
              <p className="text-sm text-slate-400">No documents attached yet.</p>
            ) : (
              <ul className="space-y-2">
                {trip.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-2 text-sm text-slate-600">
                    <FileText size={15} className="text-slate-400" /> {doc.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">DRIVER</p>
            {trip.driver ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar name={trip.driver.name} size={40} />
                  <div>
                    <p className="font-medium text-slate-800">{trip.driver.name}</p>
                    <p className="text-xs text-slate-400">★ {trip.driver.rating.toFixed(1)}</p>
                  </div>
                </div>
                <a
                  href={`tel:${trip.driver.phone}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
                >
                  <Phone size={13} /> {trip.driver.phone}
                </a>
              </>
            ) : trip.manualDriverName ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar name={trip.manualDriverName} size={40} />
                  <div>
                    <p className="font-medium text-slate-800">{trip.manualDriverName}</p>
                    <p className="text-xs text-slate-400">Manually entered (not registered)</p>
                  </div>
                </div>
                {trip.manualDriverPhone && (
                  <a
                    href={`tel:${trip.manualDriverPhone}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
                  >
                    <Phone size={13} /> {trip.manualDriverPhone}
                  </a>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400">Unassigned</p>
            )}
          </div>

          <AllowanceCard
            tripId={trip.id}
            driverAllowance={trip.driverAllowance}
            allowancePaid={trip.allowancePaid}
            allowancePaidAt={trip.allowancePaidAt ? trip.allowancePaidAt.toISOString() : null}
            allowanceSlipUrl={trip.allowanceSlipUrl}
            allowanceSentBy={trip.allowanceSentBy}
            docsReceived={!!trip.shipment.settlement?.docsReceivedAt}
            docsReceivedAt={trip.shipment.settlement?.docsReceivedAt?.toISOString() ?? null}
          />

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">TRIP INFO</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Vehicle</dt>
                <dd className="font-medium text-slate-700">
                  {trip.vehicle?.plateNumber ?? trip.manualVehicle ?? "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Customer</dt>
                <dd className="font-medium text-slate-700">{trip.shipment.customer.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Distance</dt>
                <dd className="font-medium text-slate-700">{trip.distanceKm ? `${trip.distanceKm} KM` : "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Departure</dt>
                <dd className="font-medium text-slate-700">{fmtDateTime(trip.departureAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">ETA</dt>
                <dd className="font-medium text-slate-700">{fmtDateTime(trip.etaAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Progress</dt>
                <dd className="font-medium text-slate-700">{trip.progressPct}%</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
