"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import { mapToLatLng } from "@/lib/constants";

export type MapTrip = {
  id: string;
  code: string;
  originName: string;
  destinationName: string;
  originX: number;
  originY: number;
  destX: number;
  destY: number;
  // Round-trip empty return leg (optional)
  returnName?: string | null;
  returnX?: number | null;
  returnY?: number | null;
  currentX?: number | null;
  currentY?: number | null;
  status: string;
};

export interface GPSMarker {
  vehicleId: string;
  plateNumber: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
}

// Trips store positions as 0-100 map percentages. Convert them to real
// lat/lng using the shared Saudi bounding box (same one the location
// picker and city placement use, so all pins line up exactly).
function percentToLatLng(x: number, y: number): [number, number] {
  const { lat, lng } = mapToLatLng(x, y);
  return [lat, lng];
}

const STATUS_COLORS: Record<string, string> = {
  DELAYED: "#ef4444",
  IN_TRANSIT: "#0ea5e9",
  DISPATCHED: "#6366f1",
  COLLECTING: "#f59e0b",
  AT_DELIVERY: "#10b981",
};

function truckIconHtml(color: string, selected: boolean, pulse: boolean) {
  return `
    <div style="position:relative;width:30px;height:30px;">
      ${pulse ? `<span style="position:absolute;inset:-6px;border-radius:9999px;background:${color}33;animation:lmPing 1.6s cubic-bezier(0,0,.2,1) infinite;"></span>` : ""}
      <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:${color};border:${selected ? "3px" : "2px"} solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
      </span>
    </div>`;
}

function pinIconHtml(color: string) {
  return `
    <svg width="26" height="26" viewBox="0 0 24 24" fill="${color}" stroke="#fff" stroke-width="1.4" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.4));">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
      <circle cx="12" cy="10" r="3" fill="#fff" stroke="none"/>
    </svg>`;
}

function gpsIconHtml(plate: string, speed?: number, heading?: number) {
  return `
    <div style="position:relative;width:28px;height:28px;">
      <span style="position:absolute;inset:-5px;border-radius:9999px;background:#f59e0b33;animation:lmPing 1.6s cubic-bezier(0,0,.2,1) infinite;"></span>
      <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:#f59e0b;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);${heading != null ? `transform:rotate(${heading}deg);` : ""}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
      </span>
      <span style="position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:3px;white-space:nowrap;background:rgba(15,23,42,.9);color:#fff;font-size:9px;font-weight:600;padding:1px 5px;border-radius:4px;">${plate}${speed != null ? ` · ${speed.toFixed(0)} km/h` : ""}</span>
    </div>`;
}

export default function LiveMap({
  trips,
  selectedTripId,
  onSelectTrip,
  height = 320,
  linkPrefix,
  gpsLocations = [],
}: {
  trips: MapTrip[];
  selectedTripId?: string;
  onSelectTrip?: (id: string) => void;
  height?: number;
  linkPrefix?: string;
  gpsLocations?: GPSMarker[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<LayerGroup | null>(null);
  const fittedRef = useRef(false);

  // Keep latest callback without re-initializing the map
  const onSelectRef = useRef(onSelectTrip);
  useEffect(() => {
    onSelectRef.current = onSelectTrip;
  });

  useEffect(() => {
    let cancelled = false;

    async function draw() {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      // Initialize map once
      if (!mapRef.current) {
        const map = L.map(containerRef.current, {
          center: [24.2, 45.0], // Saudi Arabia
          zoom: 5,
          zoomControl: true,
          attributionControl: true,
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);
        mapRef.current = map;
        layersRef.current = L.layerGroup().addTo(map);
      }

      const map = mapRef.current;
      const layers = layersRef.current!;
      layers.clearLayers();

      const boundPoints: [number, number][] = [];

      for (const t of trips) {
        const origin = percentToLatLng(t.originX, t.originY);
        const dest = percentToLatLng(t.destX, t.destY);
        const selected = selectedTripId === t.id;
        const color =
          t.status === "DELAYED"
            ? "#ef4444"
            : selected
              ? "#2563eb"
              : STATUS_COLORS[t.status] ?? "#93b4dd";

        boundPoints.push(origin, dest);

        // Route line
        L.polyline([origin, dest], {
          color,
          weight: selected ? 4 : 2.5,
          opacity: selected || trips.length === 1 ? 0.9 : 0.5,
          dashArray: ["IN_TRANSIT", "DISPATCHED", "COLLECTING", "AT_DELIVERY", "DELAYED"].includes(t.status)
            ? "8 8"
            : undefined,
        }).addTo(layers);

        // Origin / destination pins
        L.marker(origin, {
          icon: L.divIcon({ html: pinIconHtml("#10b981"), className: "", iconSize: [26, 26], iconAnchor: [13, 24] }),
        })
          .bindTooltip(`${t.code} · Pickup: ${t.originName}`)
          .addTo(layers);

        L.marker(dest, {
          icon: L.divIcon({ html: pinIconHtml("#ef4444"), className: "", iconSize: [26, 26], iconAnchor: [13, 24] }),
        })
          .bindTooltip(`${t.code} · Delivery: ${t.destinationName}`)
          .addTo(layers);

        // Round-trip empty return leg: dashed cyan line + cyan pin
        if (t.returnX != null && t.returnY != null) {
          const ret = percentToLatLng(t.returnX, t.returnY);
          boundPoints.push(ret);
          L.polyline([dest, ret], {
            color: "#0891b2",
            weight: selected ? 3.5 : 2,
            opacity: selected || trips.length === 1 ? 0.8 : 0.45,
            dashArray: "3 8",
          }).addTo(layers);
          L.marker(ret, {
            icon: L.divIcon({ html: pinIconHtml("#0891b2"), className: "", iconSize: [26, 26], iconAnchor: [13, 24] }),
          })
            .bindTooltip(`${t.code} · Empty Return: ${t.returnName ?? "Return point"}`)
            .addTo(layers);
        }

        // Current truck position
        if (t.currentX != null && t.currentY != null) {
          const cur = percentToLatLng(t.currentX, t.currentY);
          boundPoints.push(cur);
          const pulse = t.status === "IN_TRANSIT" || t.status === "DELAYED";
          const marker = L.marker(cur, {
            icon: L.divIcon({
              html: truckIconHtml(t.status === "DELAYED" ? "#ef4444" : selected ? "#2563eb" : "#0ea5e9", selected, pulse),
              className: "",
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            }),
            zIndexOffset: 500,
          })
            .bindTooltip(`${t.code} · ${t.originName} → ${t.destinationName}`)
            .addTo(layers);
          marker.on("click", () => onSelectRef.current?.(t.id));
        }
      }

      // Live GPS-tracked vehicles (real coordinates from Tracking Maps)
      for (const g of gpsLocations) {
        const pos: [number, number] = [g.latitude, g.longitude];
        boundPoints.push(pos);
        L.marker(pos, {
          icon: L.divIcon({
            html: gpsIconHtml(g.plateNumber, g.speed, g.heading),
            className: "",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
          zIndexOffset: 600,
        })
          .bindTooltip(`${g.plateNumber} — live GPS`)
          .addTo(layers);
      }

      // Fit map to markers on first meaningful draw
      if (!fittedRef.current && boundPoints.length > 0) {
        fittedRef.current = true;
        map.fitBounds(L.latLngBounds(boundPoints).pad(0.25), { maxZoom: 11 });
      }
    }

    draw();
    return () => {
      cancelled = true;
    };
  }, [trips, gpsLocations, selectedTripId]);

  // Recenter on the selected trip when it changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedTripId) return;
    const t = trips.find((x) => x.id === selectedTripId);
    if (!t) return;
    const focus =
      t.currentX != null && t.currentY != null
        ? percentToLatLng(t.currentX, t.currentY)
        : percentToLatLng((t.originX + t.destX) / 2, (t.originY + t.destY) / 2);
    map.panTo(focus, { animate: true });
  }, [selectedTripId, trips]);

  // Destroy map on unmount
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-slate-200"
      style={{ height }}
    >
      <style>{`@keyframes lmPing{75%,100%{transform:scale(2);opacity:0}}`}</style>
      <div ref={containerRef} className="absolute inset-0 z-0" />
      {linkPrefix && trips.length === 0 && gpsLocations.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center text-sm text-slate-500">
          No active trips to display
        </div>
      )}
    </div>
  );
}
