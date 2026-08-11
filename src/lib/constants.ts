export const ROLES = [
  "ADMIN",
  "OPERATIONS_MANAGER",
  "DISPATCHER",
  "DRIVER",
  "VIEWER",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  OPERATIONS_MANAGER: "Operations Manager",
  DISPATCHER: "Dispatcher",
  DRIVER: "Driver",
  VIEWER: "Viewer",
};

export const VEHICLE_STATUSES = ["AVAILABLE", "ON_TRIP", "MAINTENANCE", "OFFLINE"] as const;
export const DRIVER_STATUSES = ["AVAILABLE", "ON_TRIP", "OFF_DUTY"] as const;

export const SHIPMENT_PRIORITIES = ["STANDARD", "EXPRESS", "OVERNIGHT"] as const;

// Equipment catalogue — a booking may request one or more of these, and every
// Carrier Tariff Book lane is quoted per vendor AND per one of these codes,
// since the same route can price very differently by truck/equipment needed.
// `cold: true` means the unit is temperature-controlled and the booking must
// carry a required temperature range.
export const VEHICLE_TYPES = [
  { code: "FLATBED", label: "Flatbed", labelAr: "سطحة", cold: false },
  { code: "LOWBED", label: "Lowbed", labelAr: "لوبد", cold: false },
  { code: "CURTAIN_SIDE", label: "Curtain Side", labelAr: "ستارة جانبية", cold: false },
  { code: "BOX_TRUCK", label: "Box Truck", labelAr: "صندوق مغلق", cold: false },
  { code: "DRY_VAN", label: "Dry Van", labelAr: "فان جاف", cold: false },
  { code: "REEFER", label: "Reefer — Chilled (2°C to 8°C)", labelAr: "مبرّد (٢ إلى ٨°)", cold: true },
  { code: "FROZEN", label: "Reefer — Frozen (-25°C to 0°C)", labelAr: "مجمّد (‎-٢٥ إلى ٠°)", cold: true },
  { code: "TANKER", label: "Tanker", labelAr: "صهريج", cold: false },
  { code: "CONTAINER_20", label: "Container Flatbed — 20ft", labelAr: "سطحة حاويات ٢٠ قدم", cold: false },
  { code: "CONTAINER_40", label: "Container Flatbed — 40ft", labelAr: "سطحة حاويات ٤٠ قدم", cold: false },
  { code: "TON_25", label: "25-Ton Truck", labelAr: "شاحنة ٢٥ طن", cold: false },
  { code: "CAR_CARRIER", label: "Car Carrier", labelAr: "ناقلة سيارات", cold: false },
  { code: "TIPPER", label: "Tipper", labelAr: "قلاب", cold: false },
  { code: "DUMP", label: "Dump Truck", labelAr: "شاحنة قلابة", cold: false },
  { code: "CRANE", label: "Crane", labelAr: "ونش", cold: false },
  { code: "HEAVY_LIFT", label: "Heavy Lift", labelAr: "رفع ثقيل", cold: false },
] as const;
export type VehicleTypeCode = (typeof VEHICLE_TYPES)[number]["code"];

export const VEHICLE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  VEHICLE_TYPES.map((v) => [v.code, v.label]),
);

// Codes that require a temperature range on the booking
export const COLD_VEHICLE_CODES = VEHICLE_TYPES.filter((v) => v.cold).map((v) => v.code);

export function isColdSelection(codes: string[]) {
  return codes.some((c) => COLD_VEHICLE_CODES.includes(c as (typeof COLD_VEHICLE_CODES)[number]));
}

// Common preset temperature bands used in Saudi cold-chain transport
export const TEMP_PRESETS = [
  { label: "Chilled +2 to +8 °C", labelAr: "مبرّد ‎+٢ إلى ‎+٨", min: 2, max: 8 },
  { label: "Chilled 0 to +4 °C", labelAr: "مبرّد ‎٠ إلى ‎+٤", min: 0, max: 4 },
  { label: "Frozen −18 °C", labelAr: "مجمّد ‎−١٨", min: -20, max: -18 },
  { label: "Deep Frozen −25 °C", labelAr: "تجميد عميق ‎−٢٥", min: -27, max: -25 },
  { label: "Controlled +15 to +25 °C", labelAr: "محكوم ‎+١٥ إلى ‎+٢٥", min: 15, max: 25 },
] as const;

export const TRIP_STATUSES = [
  "PENDING",
  "DISPATCHED",
  "COLLECTING",
  "IN_TRANSIT",
  "AT_DELIVERY",
  "DELIVERED",
  "RETURN_TRANSIT",
  "AT_RETURN",
  "RETURN_OFFLOADED",
  "DELAYED",
  "CANCELLED",
] as const;
export type TripStatusT = (typeof TRIP_STATUSES)[number];

export const TRIP_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  DISPATCHED: "Dispatched",
  COLLECTING: "Collecting",
  IN_TRANSIT: "In Transit",
  AT_DELIVERY: "At Delivery",
  DELIVERED: "Delivered",
  RETURN_TRANSIT: "In Transit to Empty Return",
  AT_RETURN: "At Empty Return Area",
  RETURN_OFFLOADED: "Empty Return Offloaded",
  DELAYED: "Delayed",
  CANCELLED: "Cancelled",
};

export const TRIP_STATUS_NOTE: Record<string, string> = {
  PENDING: "Waiting",
  DISPATCHED: "Assigned",
  COLLECTING: "Loading",
  IN_TRANSIT: "On the way",
  AT_DELIVERY: "Arrived",
  DELIVERED: "Completed",
  RETURN_TRANSIT: "Returning empty",
  AT_RETURN: "Waiting for offloading",
  RETURN_OFFLOADED: "Cycle completed",
  DELAYED: "Traffic Issue",
  CANCELLED: "Cancelled",
};

// Trip type: ONE_WAY | ROUND_TRIP
export const TRIP_TYPES = ["ONE_WAY", "ROUND_TRIP"] as const;
export const TRIP_TYPE_LABELS: Record<string, string> = {
  ONE_WAY: "One Way",
  ROUND_TRIP: "Round Trip (empty return)",
};

// Ordered driver status flow per trip type (used by the advance/back controls)
export const ONE_WAY_FLOW = [
  "DISPATCHED",
  "COLLECTING",
  "IN_TRANSIT",
  "AT_DELIVERY",
  "DELIVERED",
] as const;
export const ROUND_TRIP_FLOW = [
  "DISPATCHED",
  "COLLECTING",
  "IN_TRANSIT",
  "AT_DELIVERY",
  "DELIVERED",
  "RETURN_TRANSIT",
  "AT_RETURN",
  "RETURN_OFFLOADED",
] as const;
export function flowFor(tripType?: string | null): readonly string[] {
  return tripType === "ROUND_TRIP" ? ROUND_TRIP_FLOW : ONE_WAY_FLOW;
}

// Logistics cycle pipeline — 6 stages for one-way, 9 for round trips
export const CYCLE_STAGES = [
  { stage: 1, key: "DISPATCHED", label: "Dispatched", sub: "Order Created & Assigned" },
  { stage: 2, key: "COLLECTING", label: "Collecting", sub: "Arrived at Pickup & Loading" },
  { stage: 3, key: "IN_TRANSIT", label: "In Transit", sub: "On the Way to Destination" },
  { stage: 4, key: "AT_DELIVERY", label: "At Delivery Side", sub: "Arrived at Delivery Location" },
  { stage: 5, key: "DELIVERED", label: "Delivered", sub: "Unloading & Completed" },
  { stage: 6, key: "LEFT_DELIVERY", label: "Left Delivery Side", sub: "Departed & Trip Completed" },
] as const;

export const ROUND_TRIP_CYCLE_STAGES = [
  { stage: 1, key: "DISPATCHED", label: "Dispatched", sub: "Order Created & Assigned" },
  { stage: 2, key: "COLLECTING", label: "Collecting", sub: "Arrived at Pickup & Loading" },
  { stage: 3, key: "IN_TRANSIT", label: "In Transit", sub: "On the Way to Destination" },
  { stage: 4, key: "AT_DELIVERY", label: "At Delivery Side", sub: "Arrived at Delivery Location" },
  { stage: 5, key: "DELIVERED", label: "Delivered", sub: "Unloading & Completed" },
  { stage: 6, key: "LEFT_DELIVERY", label: "Left Delivery Side", sub: "Departed Delivery Location" },
  { stage: 7, key: "RETURN_TRANSIT", label: "Transit to Empty Return", sub: "On the Way to Return Area" },
  { stage: 8, key: "AT_RETURN", label: "At Empty Return", sub: "Reached Return Area — Waiting for Offloading" },
  { stage: 9, key: "RETURN_OFFLOADED", label: "Return Offloaded", sub: "Empty Container Offloaded — Cycle Completed" },
] as const;

export function cycleStagesFor(tripType?: string | null) {
  return tripType === "ROUND_TRIP" ? ROUND_TRIP_CYCLE_STAGES : CYCLE_STAGES;
}

// Cycle stage number for a trip status (shared by dashboard/detail pages)
export function stageOfStatus(status: string): number {
  const map: Record<string, number> = {
    PENDING: 1,
    DISPATCHED: 1,
    COLLECTING: 2,
    IN_TRANSIT: 3,
    DELAYED: 3,
    AT_DELIVERY: 4,
    DELIVERED: 5,
    RETURN_TRANSIT: 7,
    AT_RETURN: 8,
    RETURN_OFFLOADED: 9,
  };
  return map[status] ?? 1;
}

// Post-delivery financial follow-up (accounts department)
export const SETTLEMENT_STAGES = [
  { stage: 1, key: "DOCS_WITH_DRIVER", label: "Delivered", sub: "Signed originals with driver" },
  { stage: 2, key: "DOCS_IN_YARD", label: "Originals in Yard", sub: "Received by dispatcher — trip money released" },
  { stage: 3, key: "WITH_ACCOUNTS", label: "With Accounts", sub: "Originals handed to accounts dept." },
  { stage: 4, key: "INVOICED", label: "Invoiced", sub: "Invoice + originals sent to customer" },
  { stage: 5, key: "PAID", label: "Paid & Closed", sub: "Payment received — shipment closed" },
] as const;

export const SETTLEMENT_STATUS_LABELS: Record<string, string> = {
  DOCS_WITH_DRIVER: "Docs with Driver",
  DOCS_IN_YARD: "Originals in Yard",
  WITH_ACCOUNTS: "With Accounts",
  INVOICED: "Invoiced — Awaiting Payment",
  PAID: "Paid & Closed",
};

export function settlementStageOf(status: string): number {
  const idx = SETTLEMENT_STAGES.findIndex((s) => s.key === status);
  return idx >= 0 ? idx + 1 : 1;
}

export const INCIDENT_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const INCIDENT_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;

export const ALERT_SEVERITIES = ["INFO", "WARNING", "CRITICAL"] as const;

// Stylized map coordinates (percentage-based, on a Saudi Arabia outline viewBox)
export const CITY_COORDS: Record<string, { x: number; y: number }> = {
  "Jeddah Warehouse": { x: 18, y: 52 },
  "Jeddah Customer": { x: 20, y: 57 },
  "Makkah Hub": { x: 22, y: 46 },
  "Riyadh DC": { x: 62, y: 40 },
  "Riyadh Customer": { x: 65, y: 44 },
  "Dammam Port": { x: 86, y: 28 },
  "Dammam Customer": { x: 88, y: 33 },
  "Taif Depot": { x: 26, y: 55 },
  "Jeddah Hospital": { x: 16, y: 48 },
  "Riyadh Hospital": { x: 60, y: 36 },
  "Madinah Hub": { x: 24, y: 30 },
  "Qassim Depot": { x: 48, y: 24 },
  "Abha Hub": { x: 30, y: 78 },
  "Tabuk Depot": { x: 20, y: 8 },
  "Jubail Terminal": { x: 84, y: 22 },
};

// Major Saudi cities with real coordinates; used for the searchable dropdown
// and for placing locations on the stylized map via latLngToMap.
export const SAUDI_CITIES: Record<string, { lat: number; lng: number }> = {
  Riyadh: { lat: 24.7136, lng: 46.6753 },
  Jeddah: { lat: 21.4858, lng: 39.1925 },
  Makkah: { lat: 21.3891, lng: 39.8579 },
  Madinah: { lat: 24.5247, lng: 39.5692 },
  Dammam: { lat: 26.4207, lng: 50.0888 },
  Khobar: { lat: 26.2172, lng: 50.1971 },
  Dhahran: { lat: 26.2361, lng: 50.0393 },
  Jubail: { lat: 27.0046, lng: 49.6603 },
  Qatif: { lat: 26.5196, lng: 49.9988 },
  "Al Ahsa (Hofuf)": { lat: 25.3487, lng: 49.5856 },
  Taif: { lat: 21.4373, lng: 40.5127 },
  Tabuk: { lat: 28.3838, lng: 36.555 },
  Buraydah: { lat: 26.326, lng: 43.975 },
  Unaizah: { lat: 26.0844, lng: 43.9935 },
  Hail: { lat: 27.5114, lng: 41.7208 },
  Abha: { lat: 18.2465, lng: 42.5117 },
  "Khamis Mushait": { lat: 18.3, lng: 42.7333 },
  Najran: { lat: 17.4924, lng: 44.1277 },
  Jazan: { lat: 16.8894, lng: 42.5706 },
  "Al Bahah": { lat: 20.0129, lng: 41.4677 },
  Sakaka: { lat: 29.9697, lng: 40.2064 },
  Arar: { lat: 30.9753, lng: 41.0381 },
  Yanbu: { lat: 24.0895, lng: 38.0618 },
  Rabigh: { lat: 22.7986, lng: 39.0349 },
  "Al Kharj": { lat: 24.1483, lng: 47.3053 },
  "Hafar Al-Batin": { lat: 28.4337, lng: 45.9601 },
  "Al Majmaah": { lat: 25.8934, lng: 45.3616 },
  "Wadi ad-Dawasir": { lat: 20.4901, lng: 44.7958 },
  Dawadmi: { lat: 24.5077, lng: 44.3924 },
  Bisha: { lat: 19.9764, lng: 42.6053 },
  "Al Qunfudhah": { lat: 19.1264, lng: 41.0789 },
  "Al Wajh": { lat: 26.2455, lng: 36.4525 },
  Umluj: { lat: 25.0213, lng: 37.2685 },
  Duba: { lat: 27.3493, lng: 35.6962 },
  NEOM: { lat: 28.1, lng: 35.2 },
  Turaif: { lat: 31.6725, lng: 38.6637 },
  Qurayyat: { lat: 31.3318, lng: 37.3428 },
  Sharurah: { lat: 17.4833, lng: 47.1167 },
  Baqaa: { lat: 27.8815, lng: 42.4174 },
};

export function coordFor(name: string): { x: number; y: number } {
  if (CITY_COORDS[name]) return CITY_COORDS[name];
  // exact city match, then look for a known city name inside the free text
  // (e.g. "Riyadh DC Exit 18" → Riyadh)
  if (SAUDI_CITIES[name]) {
    const c = SAUDI_CITIES[name];
    return latLngToMap(c.lat, c.lng);
  }
  const lower = name.toLowerCase();
  for (const [city, c] of Object.entries(SAUDI_CITIES)) {
    if (lower.includes(city.toLowerCase())) return latLngToMap(c.lat, c.lng);
  }
  // deterministic pseudo-random fallback so unseen names still place sensibly
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return { x: 15 + (hash % 70), y: 10 + ((hash >> 4) % 70) };
}

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  DISPATCHED: "bg-blue-50 text-blue-700 ring-blue-600/20",
  COLLECTING: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  IN_TRANSIT: "bg-sky-50 text-sky-700 ring-sky-600/20",
  AT_DELIVERY: "bg-purple-50 text-purple-700 ring-purple-600/20",
  DELIVERED: "bg-green-50 text-green-700 ring-green-600/20",
  RETURN_TRANSIT: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
  AT_RETURN: "bg-violet-50 text-violet-700 ring-violet-600/20",
  RETURN_OFFLOADED: "bg-teal-50 text-teal-700 ring-teal-600/20",
  DELAYED: "bg-red-50 text-red-700 ring-red-600/20",
  CANCELLED: "bg-violet-50 text-violet-700 ring-violet-600/20",
  AVAILABLE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  ON_TRIP: "bg-blue-50 text-blue-700 ring-blue-600/20",
  MAINTENANCE: "bg-amber-50 text-amber-700 ring-amber-600/20",
  OFFLINE: "bg-gray-100 text-gray-600 ring-gray-500/20",
  OFF_DUTY: "bg-gray-100 text-gray-600 ring-gray-500/20",
  OPEN: "bg-red-50 text-red-700 ring-red-600/20",
  IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-600/20",
  RESOLVED: "bg-green-50 text-green-700 ring-green-600/20",
  LOW: "bg-gray-100 text-gray-600 ring-gray-500/20",
  MEDIUM: "bg-amber-50 text-amber-700 ring-amber-600/20",
  HIGH: "bg-orange-50 text-orange-700 ring-orange-600/20",
  CRITICAL: "bg-red-50 text-red-700 ring-red-600/20",
  STANDARD: "bg-blue-50 text-blue-700 ring-blue-600/20",
  EXPRESS: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  OVERNIGHT: "bg-orange-50 text-orange-700 ring-orange-600/20",
};

export function genCode(prefix: string, n: number, pad = 5) {
  return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(pad, "0")}`;
}

// Geographic bounding box calibrated so real lat/lng lands near the stylized
// map's existing city positions (Riyadh ≈ 62,38 / Jeddah ≈ 15,54 / Dammam ≈ 83,30).
export const MAP_BBOX = {
  latTop: 32.36,
  latBottom: 12.25,
  lngLeft: 36.8,
  lngRight: 52.74,
};

export function latLngToMap(lat: number, lng: number) {
  const x = ((lng - MAP_BBOX.lngLeft) / (MAP_BBOX.lngRight - MAP_BBOX.lngLeft)) * 100;
  const y = ((MAP_BBOX.latTop - lat) / (MAP_BBOX.latTop - MAP_BBOX.latBottom)) * 100;
  return { x: Math.min(98, Math.max(2, x)), y: Math.min(98, Math.max(2, y)) };
}

export function mapToLatLng(x: number, y: number) {
  const lng = MAP_BBOX.lngLeft + (x / 100) * (MAP_BBOX.lngRight - MAP_BBOX.lngLeft);
  const lat = MAP_BBOX.latTop - (y / 100) * (MAP_BBOX.latTop - MAP_BBOX.latBottom);
  return { lat: Math.round(lat * 100000) / 100000, lng: Math.round(lng * 100000) / 100000 };
}

// Extract coordinates from pasted text: Google Maps URLs (@lat,lng or ?q=lat,lng),
// or a raw "lat, lng" pair anywhere in the string.
export function parseLatLngInput(text: string): { lat: number; lng: number } | null {
  const t = text.trim();
  if (!t) return null;
  const m =
    t.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/) ??
    t.match(/[?&](?:q|query|ll|center)=(-?\d{1,2}\.?\d*)(?:,|%2C)(-?\d{1,3}\.?\d*)/i) ??
    t.match(/(-?\d{1,2}\.\d+)\s*[,\s]\s*(-?\d{1,3}\.\d+)/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}
