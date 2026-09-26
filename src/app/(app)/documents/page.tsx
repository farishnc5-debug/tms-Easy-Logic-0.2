import Link from "next/link";
import { FileText, Download, Trash2, Upload } from "lucide-react";
import { db } from "@/lib/db";
import ConfirmSubmitButton from "@/components/ui/confirm-submit-button";
import { deleteDocument, uploadDocument } from "@/lib/actions/documents";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const shipmentId = typeof sp.shipmentId === "string" ? sp.shipmentId : "";
  const tripId = typeof sp.tripId === "string" ? sp.tripId : "";

  const [documents, shipment, trip] = await Promise.all([
    db.document.findMany({
      where: {
        ...(shipmentId ? { shipmentId } : {}),
        ...(tripId ? { tripId } : {}),
      },
      include: { shipment: true, trip: true, uploadedBy: true },
      orderBy: { createdAt: "desc" },
    }),
    shipmentId ? db.shipment.findUnique({ where: { id: shipmentId } }) : null,
    tripId ? db.trip.findUnique({ where: { id: tripId } }) : null,
  ]);

  return (
    <div className="space-y-6">
      {(shipment || trip) && (
        <div className="rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-700">
          Filtered to {shipment ? `shipment ${shipment.code}` : `trip ${trip?.code}`}.{" "}
          <Link href="/documents" className="font-medium underline">
            Clear filter
          </Link>
        </div>
      )}

      <div className="card p-5">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-400">
          <Upload size={14} /> UPLOAD DOCUMENT
        </p>
        <form action={uploadDocument} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {shipmentId && <input type="hidden" name="shipmentId" value={shipmentId} />}
          {tripId && <input type="hidden" name="tripId" value={tripId} />}
          <input
            type="file"
            name="file"
            required
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Upload
          </button>
        </form>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Linked To</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-slate-400" />
                      <span className="font-medium text-slate-700">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {doc.shipment ? (
                      <Link href={`/shipments/${doc.shipment.id}`} className="text-brand-600 hover:underline">
                        {doc.shipment.code}
                      </Link>
                    ) : doc.trip ? (
                      <Link href={`/trips/${doc.trip.id}`} className="text-brand-600 hover:underline">
                        {doc.trip.code}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{doc.sizeKb ? `${doc.sizeKb} KB` : "-"}</td>
                  <td className="px-4 py-3 text-slate-500">{timeAgo(doc.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={doc.dataUrl}
                        download={doc.name}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Download"
                      >
                        <Download size={15} />
                      </a>
                      <form action={deleteDocument.bind(null, doc.id)}>
                        <ConfirmSubmitButton
                          message="Delete this document?"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">
                    No documents uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
