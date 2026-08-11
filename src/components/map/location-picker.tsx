"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, ClipboardPaste, X, Crosshair } from "lucide-react";
import { latLngToMap, mapToLatLng, parseLatLngInput } from "@/lib/constants";
import { useT } from "@/components/layout/locale-provider";

type Pin = { x: number; y: number } | null;

function pickerPinHtml(color: string) {
  return `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="${color}" stroke="#fff" stroke-width="1.4" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.4));">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
      <circle cx="12" cy="10" r="3" fill="#fff" stroke="none"/>
    </svg>`;
}

function PinStatus({ pin, color, onClear }: { pin: Pin; color: string; onClear: () => void }) {
  if (!pin) return <p className="text-xs text-slate-400">No pin set — click the map or paste a link</p>;
  const { lat, lng } = mapToLatLng(pin.x, pin.y);
  return (
    <p className="flex items-center gap-1.5 text-xs">
      <MapPin size={12} style={{ color }} />
      <span className="font-medium text-slate-600">
        {lat.toFixed(5)}, {lng.toFixed(5)}
      </span>
      <button
        type="button"
        onClick={onClear}
        className="ml-1 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
        title="Clear pin"
      >
        <X size={12} />
      </button>
    </p>
  );
}

export default function LocationPicker({
  defaults,
  showReturn = false,
}: {
  defaults?: {
    originAddress?: string | null;
    destinationAddress?: string | null;
    returnAddress?: string | null;
    originX?: number | null;
    originY?: number | null;
    destX?: number | null;
    destY?: number | null;
    returnX?: number | null;
    returnY?: number | null;
  };
  // Round trips show a 3rd column + 3rd pin for the empty-return location
  showReturn?: boolean;
}) {
  const [mode, setMode] = useState<"origin" | "destination" | "return">("origin");
  const [originPin, setOriginPin] = useState<Pin>(
    defaults?.originX != null && defaults?.originY != null
      ? { x: defaults.originX, y: defaults.originY }
      : null,
  );
  const [destPin, setDestPin] = useState<Pin>(
    defaults?.destX != null && defaults?.destY != null
      ? { x: defaults.destX, y: defaults.destY }
      : null,
  );
  const [returnPin, setReturnPin] = useState<Pin>(
    defaults?.returnX != null && defaults?.returnY != null
      ? { x: defaults.returnX, y: defaults.returnY }
      : null,
  );
  const [pasteMsg, setPasteMsg] = useState<{ target: string; ok: boolean; text: string } | null>(
    null,
  );
  const t = useT();
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<LayerGroup | null>(null);

  // Refs so the Leaflet click handler always sees the latest mode/setters
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const showReturnRef = useRef(showReturn);
  showReturnRef.current = showReturn;

  function placeFromLatLng(lat: number, lng: number) {
    const pin = latLngToMap(lat, lng);
    if (modeRef.current === "origin") {
      setOriginPin(pin);
      setMode("destination");
    } else if (modeRef.current === "destination") {
      setDestPin(pin);
      if (showReturnRef.current) setMode("return");
    } else {
      setReturnPin(pin);
    }
  }
  const placeRef = useRef(placeFromLatLng);
  placeRef.current = placeFromLatLng;

  // Initialize the real map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapDivRef.current || mapRef.current) return;
      const map = L.map(mapDivRef.current, { center: [24.2, 45.0], zoom: 5 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        placeRef.current(e.latlng.lat, e.latlng.lng);
      });
      mapRef.current = map;
      layersRef.current = L.layerGroup().addTo(map);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
  }, []);

  // Redraw pins + route line whenever they change
  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;
      const layers = layersRef.current;
      if (!layers) return;
      layers.clearLayers();

      const pts: [number, number][] = [];
      if (originPin) {
        const { lat, lng } = mapToLatLng(originPin.x, originPin.y);
        pts.push([lat, lng]);
        L.marker([lat, lng], {
          icon: L.divIcon({ html: pickerPinHtml("#10b981"), className: "", iconSize: [28, 28], iconAnchor: [14, 26] }),
        })
          .bindTooltip("Origin")
          .addTo(layers);
      }
      if (destPin) {
        const { lat, lng } = mapToLatLng(destPin.x, destPin.y);
        pts.push([lat, lng]);
        L.marker([lat, lng], {
          icon: L.divIcon({ html: pickerPinHtml("#ef4444"), className: "", iconSize: [28, 28], iconAnchor: [14, 26] }),
        })
          .bindTooltip("Destination")
          .addTo(layers);
      }
      if (pts.length === 2) {
        L.polyline(pts, { color: "#2563eb", weight: 3, opacity: 0.8, dashArray: "8 8" }).addTo(layers);
      }
      // Empty-return pin + return leg line (round trips)
      if (showReturn && returnPin) {
        const { lat, lng } = mapToLatLng(returnPin.x, returnPin.y);
        L.marker([lat, lng], {
          icon: L.divIcon({ html: pickerPinHtml("#0891b2"), className: "", iconSize: [28, 28], iconAnchor: [14, 26] }),
        })
          .bindTooltip("Empty Return")
          .addTo(layers);
        if (destPin) {
          const d = mapToLatLng(destPin.x, destPin.y);
          L.polyline(
            [
              [d.lat, d.lng],
              [lat, lng],
            ],
            { color: "#0891b2", weight: 3, opacity: 0.7, dashArray: "3 8" },
          ).addTo(layers);
        }
      }
    })();
  }, [originPin, destPin, returnPin, showReturn]);

  function tryPaste(target: "origin" | "destination" | "return", text: string) {
    const coords = parseLatLngInput(text);
    if (!coords) {
      setPasteMsg({
        target,
        ok: false,
        text: "No coordinates found — paste a full Google Maps link or \"lat, lng\" (short goo.gl links don't contain coordinates).",
      });
      return;
    }
    const pin = latLngToMap(coords.lat, coords.lng);
    if (target === "origin") setOriginPin(pin);
    else if (target === "return") setReturnPin(pin);
    else setDestPin(pin);
    setPasteMsg({
      target,
      ok: true,
      text: `Pin set from coordinates ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
        PRECISE LOCATIONS (OPTIONAL) — DROP A PIN OR PASTE A MAPS LINK
      </p>

      {/* hidden fields posted with the form */}
      <input type="hidden" name="originX" value={originPin?.x ?? ""} />
      <input type="hidden" name="originY" value={originPin?.y ?? ""} />
      <input type="hidden" name="destX" value={destPin?.x ?? ""} />
      <input type="hidden" name="destY" value={destPin?.y ?? ""} />
      <input type="hidden" name="returnX" value={showReturn ? (returnPin?.x ?? "") : ""} />
      <input type="hidden" name="returnY" value={showReturn ? (returnPin?.y ?? "") : ""} />

      <div className={`grid grid-cols-1 gap-4 ${showReturn ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Origin Address / Maps Link
          </label>
          <div className="flex gap-1.5">
            <input
              name="originAddress"
              defaultValue={defaults?.originAddress ?? ""}
              placeholder="Paste address, Google Maps link or lat, lng"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              onBlur={(e) => {
                if (parseLatLngInput(e.target.value)) tryPaste("origin", e.target.value);
              }}
            />
            <button
              type="button"
              title="Set pin from pasted link/coordinates"
              onClick={(e) => {
                const input = (e.currentTarget.previousSibling as HTMLInputElement);
                tryPaste("origin", input.value);
              }}
              className="shrink-0 rounded-lg border border-slate-200 px-2.5 text-slate-500 hover:bg-slate-50 hover:text-emerald-600"
            >
              <ClipboardPaste size={15} />
            </button>
          </div>
          <div className="mt-1">
            <PinStatus pin={originPin} color="#059669" onClear={() => setOriginPin(null)} />
          </div>
          {pasteMsg?.target === "origin" && (
            <p className={`mt-1 text-xs ${pasteMsg.ok ? "text-emerald-600" : "text-amber-600"}`}>
              {pasteMsg.text}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Destination Address / Maps Link
          </label>
          <div className="flex gap-1.5">
            <input
              name="destinationAddress"
              defaultValue={defaults?.destinationAddress ?? ""}
              placeholder="Paste address, Google Maps link or lat, lng"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              onBlur={(e) => {
                if (parseLatLngInput(e.target.value)) tryPaste("destination", e.target.value);
              }}
            />
            <button
              type="button"
              title="Set pin from pasted link/coordinates"
              onClick={(e) => {
                const input = (e.currentTarget.previousSibling as HTMLInputElement);
                tryPaste("destination", input.value);
              }}
              className="shrink-0 rounded-lg border border-slate-200 px-2.5 text-slate-500 hover:bg-slate-50 hover:text-red-500"
            >
              <ClipboardPaste size={15} />
            </button>
          </div>
          <div className="mt-1">
            <PinStatus pin={destPin} color="#dc2626" onClear={() => setDestPin(null)} />
          </div>
          {pasteMsg?.target === "destination" && (
            <p className={`mt-1 text-xs ${pasteMsg.ok ? "text-emerald-600" : "text-amber-600"}`}>
              {pasteMsg.text}
            </p>
          )}
        </div>

        {showReturn && (
          <div>
            <label className="mb-1 block text-sm font-medium text-cyan-800">
              Empty Return Address / Maps Link
            </label>
            <div className="flex gap-1.5">
              <input
                name="returnAddress"
                defaultValue={defaults?.returnAddress ?? ""}
                placeholder="Paste address, Google Maps link or lat, lng"
                className="w-full rounded-lg border border-cyan-200 bg-cyan-50/40 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                onBlur={(e) => {
                  if (parseLatLngInput(e.target.value)) tryPaste("return", e.target.value);
                }}
              />
              <button
                type="button"
                title="Set pin from pasted link/coordinates"
                onClick={(e) => {
                  const input = (e.currentTarget.previousSibling as HTMLInputElement);
                  tryPaste("return", input.value);
                }}
                className="shrink-0 rounded-lg border border-slate-200 px-2.5 text-slate-500 hover:bg-slate-50 hover:text-cyan-600"
              >
                <ClipboardPaste size={15} />
              </button>
            </div>
            <div className="mt-1">
              <PinStatus pin={returnPin} color="#0891b2" onClear={() => setReturnPin(null)} />
            </div>
            {pasteMsg?.target === "return" && (
              <p className={`mt-1 text-xs ${pasteMsg.ok ? "text-emerald-600" : "text-amber-600"}`}>
                {pasteMsg.text}
              </p>
            )}
          </div>
        )}
      </div>

      {/* mode toggle */}
      <div className="mt-4 flex items-center gap-2">
        <Crosshair size={14} className="text-slate-400" />
        <span className="text-xs text-slate-500">Map click drops:</span>
        <button
          type="button"
          onClick={() => setMode("origin")}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
            mode === "origin"
              ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {t("Origin pin")}
        </button>
        <button
          type="button"
          onClick={() => setMode("destination")}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
            mode === "destination"
              ? "bg-red-100 text-red-700 ring-1 ring-red-300"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {t("Destination pin")}
        </button>
        {showReturn && (
          <button
            type="button"
            onClick={() => setMode("return")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
              mode === "return"
                ? "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-300"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {t("Empty return pin")}
          </button>
        )}
        {(originPin || destPin || returnPin) && (
          <button
            type="button"
            onClick={() => {
              setOriginPin(null);
              setDestPin(null);
              setReturnPin(null);
              setMode("origin");
              setPasteMsg(null);
            }}
            className="ml-auto flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
          >
            <X size={12} /> {t("Clear all pins")}
          </button>
        )}
      </div>

      {/* real interactive map — click to drop a pin */}
      <div
        ref={mapDivRef}
        data-testid="picker-map"
        className="relative z-0 mt-2 h-72 w-full cursor-crosshair overflow-hidden rounded-xl border border-slate-200"
      />
      <p className="mt-1.5 text-[11px] text-slate-400">
        Zoom in and click the exact spot on the map to drop a pin, or paste a Google Maps link /
        coordinates above. If no pin is set, the system places locations by the
        origin/destination name.
      </p>
    </div>
  );
}
