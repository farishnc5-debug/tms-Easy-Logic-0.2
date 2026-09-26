import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Banknote, Pencil, Trash2, Phone, FileText, AlertTriangle, BadgeCheck, Printer } from "lucide-react";
import { db } from "@/lib/db";
import { StatusBadge, Pill } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import CycleStepper from "@/components/dashboard/cycle-stepper";
import LiveMap from "@/components/map/live-map";
import StatusControls from "@/components/trips/status-controls";
import DispatchForm from "@/components/shipments/dispatch-form";
import ConfirmSubmitButton from "@/components/ui/confirm-submit-button";
import { deleteShipment, cancelBooking } from "@/lib/actions/shipments";
import { fmtDateTime, fmtDate } from "@/lib/format";
import { stageOfStatus, VEHICLE_TYPE_LABELS } from "@/lib/constants";
import AlarmCard from "@/components/shipments/alarm-card";
import WasiqaCard from "@/components/shipments/wasiqa-card";

export default async function ShipmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const showLockedNotice = sp.locked === "1";

  const shipment = await db.shipment.findUnique({
    where: { id },
    include: {
      customer: true,
      trip: { include: { driver: true, vehicle: true, incidents: true, documents: true } },
      documents: true,
      pod: true,
      stops: { orderBy: { seq: "asc" } },
      alarms: { where: { status: { not: "DISMISSED" } }, orderBy: { triggerAt: "asc" } },
    },
  });
  if (!shipment) notFound();

  // Available drivers plus each one's assigned truck (even if that truck is
  // currently marked busy) so the auto-link preselect always has its target.
  const [availableDrivers, availableVehicles] = shipment.status === "PENDING"
    ? await Promise.all([
        db.driver.findMany({ where: { status: "AVAILABLE" }, orderBy: { rating: "desc" } }),
        db.vehicle.findMany({ where: { status: "AVAILABLE" }, orderBy: { plateNumber: "asc" } }),
      ])
    : [[], []];

  const linkedVehicleIds = availableDrivers
    .map((d) => d.vehicleId)
    .filter((v): v is string => !!v && !availableVehicles.some((av) => av.id === v));
  const linkedVehicles = linkedVehicleIds.length
    ? await db.vehicle.findMany({ where: { id: { in: linkedVehicleIds } } })
    : [];
  const dispatchVehicles = [...availableVehicles, ...linkedVehicles];

  const trip = shipment.trip;
  const currentStage = trip ? stageOfStatus(trip.status) : 0;

  const deleteAction = deleteShipment.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/shipments" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={15} /> Back to Shipments
        </Link>
        <div className="flex items-center gap-2">
          {shipment.status === "DELIVERED" && (
            <Link
              href={`/settlements/${id}`}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              <Banknote size={14} /> Payment Follow-up
            </Link>
          )}
          <Link
            href={`/print/waybill/${id}`}
            className="flex items-center gap-1.5 rounded-lg bg-[#0b1b3a] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#132a54]"
          >
            <Printer size={14} /> Print Waybill
          </Link>
          {!trip && shipment.status !== "CANCELLED" && (
            <>
              <Link
                href={`/shipments/${id}/edit`}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Pencil size={14} /> Edit
              </Link>
              <form action={deleteAction}>
                <ConfirmSubmitButton
                  message="Delete this shipment? This cannot be undone."
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                >
                  <Trash2 size={14} /> Delete
                </ConfirmSubmitButton>
              </form>
            </>
          )}
        </div>
      </div>

      {showLockedNotice && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-600/20">
          This booking is locked — a driver has already been dispatched, so it can no longer be
          edited. You can only cancel it (with a reason) below.
        </div>
      )}

      {shipment.status === "CANCELLED" && shipment.cancelReason && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-600/20">
          <span className="font-semibold">Booking cancelled.</span> Reason:{" "}
          {shipment.cancelReason}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-slate-900">{shipment.code}</h2>
        <StatusBadge status={shipment.status} />
        <Pill className="bg-slate-100 text-slate-600">{shipment.priority}</Pill>
      </div>

      <CycleStepper
        currentStage={currentStage}
        tripType={shipment.tripType}
        timestamps={
          trip
            ? {
                dispatchedAt: trip.dispatchedAt,
                collectingAt: trip.collectingAt,
                inTransitAt: trip.inTransitAt,
                atDeliveryAt: trip.atDeliveryAt,
                deliveredAt: trip.deliveredAt,
                leftDeliveryAt: trip.leftDeliveryAt,
                returnTransitAt: trip.returnTransitAt,
                atReturnAt: trip.atReturnAt,
                returnOffloadedAt: trip.returnOffloadedAt,
              }
            : {
                dispatchedAt: null,
                collectingAt: null,
                inTransitAt: null,
                atDeliveryAt: null,
                deliveredAt: null,
                leftDeliveryAt: null,
              }
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {trip ? (
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold tracking-widest text-slate-400">
                  TRIP {trip.code}
                </p>
                <StatusControls
                  tripId={trip.id}
                  status={trip.status}
                  tripType={shipment.tripType}
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
                height={260}
              />
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-400">
                    Driver{trip.manualDriverName ? " (manual)" : ""}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Avatar name={trip.driver?.name ?? trip.manualDriverName ?? "?"} size={22} />
                    <span className="text-sm font-medium text-slate-700">
                      {trip.driver?.name ?? trip.manualDriverName ?? "-"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Vehicle</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {trip.vehicle?.plateNumber ?? trip.manualVehicle ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Distance</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {trip.distanceKm ? `${trip.distanceKm} KM` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">ETA</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{fmtDateTime(trip.etaAt)}</p>
                </div>
              </div>
              {(trip.driver?.phone ?? trip.manualDriverPhone) && (
                <a
                  href={`tel:${trip.driver?.phone ?? trip.manualDriverPhone}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
                >
                  <Phone size={13} /> Call {trip.driver?.name ?? trip.manualDriverName} ·{" "}
                  {trip.driver?.phone ?? trip.manualDriverPhone}
                </a>
              )}

              {trip.status !== "DELIVERED" && trip.status !== "CANCELLED" && (
                <details className="mt-4 rounded-lg border border-red-100 bg-red-50/50">
                  <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-red-700">
                    Cancel this booking…
                  </summary>
                  <form action={cancelBooking} className="space-y-2 px-4 pb-4">
                    <input type="hidden" name="shipmentId" value={shipment.id} />
                    <label className="block text-xs font-medium text-red-800">
                      Reason for cancellation (required)
                    </label>
                    <textarea
                      name="reason"
                      required
                      rows={2}
                      placeholder="e.g. Customer withdrew the order / cargo not ready at loading point"
                      className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      Confirm Cancellation
                    </button>
                  </form>
                </details>
              )}
            </div>
          ) : (
            <div className="card p-5">
              <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
                DISPATCH THIS SHIPMENT
              </p>
              {shipment.status === "CANCELLED" ? (
                <p className="text-sm text-slate-400">
                  This booking was cancelled and can no longer be dispatched.
                </p>
              ) : (
                <DispatchForm
                  shipmentId={shipment.id}
                  drivers={availableDrivers.map((d) => ({
                    id: d.id,
                    name: d.name,
                    phone: d.phone,
                    rating: d.rating,
                    vehicleId: d.vehicleId,
                  }))}
                  vehicles={dispatchVehicles.map((v) => ({
                    id: v.id,
                    plateNumber: v.plateNumber,
                    vehicleType: v.vehicleType,
                    status: v.status,
                  }))}
                />
              )}
            </div>
          )}

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-widest text-slate-400">DOCUMENTS</p>
              <Link
                href={`/documents?shipmentId=${shipment.id}`}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Manage →
              </Link>
            </div>
            {shipment.documents.length === 0 ? (
              <p className="text-sm text-slate-400">No documents attached yet.</p>
            ) : (
              <ul className="space-y-2">
                {shipment.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-2 text-sm text-slate-600">
                    <FileText size={15} className="text-slate-400" /> {doc.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {trip && trip.incidents.length > 0 && (
            <div className="card p-5">
              <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">INCIDENTS</p>
              <ul className="space-y-2">
                {trip.incidents.map((inc) => (
                  <li key={inc.id} className="flex items-start gap-2 text-sm">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
                    <div>
                      <p className="font-medium text-slate-700">{inc.title}</p>
                      <p className="text-xs text-slate-400">{inc.description}</p>
                    </div>
                    <StatusBadge status={inc.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {shipment.pod && (
            <div className="card p-5">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-400">
                <BadgeCheck size={14} className="text-emerald-500" /> PROOF OF DELIVERY
              </p>
              <p className="text-sm text-slate-700">Received by: {shipment.pod.receivedBy}</p>
              {shipment.pod.notes && <p className="text-sm text-slate-500">{shipment.pod.notes}</p>}
              <p className="mt-1 text-xs text-slate-400">{fmtDateTime(shipment.pod.createdAt)}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <AlarmCard shipmentId={shipment.id} alarms={shipment.alarms} />

          <WasiqaCard
            shipmentId={shipment.id}
            wasiqaNumber={shipment.wasiqaNumber}
            wasiqaStatus={shipment.wasiqaStatus}
            wasiqaIssuedAt={shipment.wasiqaIssuedAt}
            wasiqaNotes={shipment.wasiqaNotes}
          />

          <div className="card p-5">
            <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">CUSTOMER</p>
            <div className="flex items-center gap-3">
              <Avatar name={shipment.customer.name} size={40} />
              <div>
                <p className="font-medium text-slate-800">{shipment.customer.name}</p>
                <p className="text-xs text-slate-400">{shipment.customer.company}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p>{shipment.customer.phone}</p>
              <p>{shipment.customer.email}</p>
              <p className="text-xs text-slate-400">{shipment.customer.address}</p>
            </div>
            <Link
              href={`/customers/${shipment.customer.id}`}
              className="mt-3 inline-block text-xs font-medium text-brand-600 hover:underline"
            >
              View customer profile →
            </Link>
          </div>

          <div className="card p-5">
            <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">SHIPMENT INFO</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Origin</dt>
                <dd className="text-right font-medium text-slate-700">
                  {shipment.originName}
                  {shipment.originAddress && (
                    <span className="block text-xs font-normal text-slate-400">
                      {shipment.originAddress}
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Destination</dt>
                <dd className="text-right font-medium text-slate-700">
                  {shipment.destinationName}
                  {shipment.destinationAddress && (
                    <span className="block text-xs font-normal text-slate-400">
                      {shipment.destinationAddress}
                    </span>
                  )}
                </dd>
              </div>
              {shipment.vehicleTypes && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Equipment</dt>
                  <dd className="text-right font-medium text-slate-700">
                    {shipment.vehicleTypes
                      .split(",")
                      .map((c) => VEHICLE_TYPE_LABELS[c] ?? c)
                      .join(", ")}
                  </dd>
                </div>
              )}
              {shipment.tempMinC != null && shipment.tempMaxC != null && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Temperature</dt>
                  <dd className="font-bold text-cyan-700">
                    {shipment.tempMinC} °C — {shipment.tempMaxC} °C
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-400">Weight</dt>
                <dd className="font-medium text-slate-700">
                  {shipment.weightKg ? `${shipment.weightKg} kg` : "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Created</dt>
                <dd className="font-medium text-slate-700">{fmtDate(shipment.createdAt)}</dd>
              </div>
            </dl>

            {shipment.stops.length > 0 && (
              <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50/60 p-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-700">
                  Delivery points ({shipment.stops.length + 1})
                </p>
                <ol className="space-y-1 text-xs text-slate-600">
                  <li>
                    <span className="font-semibold text-slate-800">1. {shipment.destinationName}</span>
                    <span className="text-slate-400"> — main destination</span>
                  </li>
                  {shipment.stops.map((s, i) => (
                    <li key={s.id}>
                      <span className="font-semibold text-slate-800">
                        {i + 2}. {s.name}
                      </span>
                      {s.address && <span className="text-slate-500"> — {s.address}</span>}
                      {s.contactPhone && (
                        <span className="block text-[11px] text-slate-400">
                          {s.contactName} {s.contactPhone}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {shipment.notes && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                {shipment.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
