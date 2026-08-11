// FAW JH6 (2025) preventive maintenance plan — intervals per the fleet
// maintenance manual. Next-due services are computed by comparing each
// truck's odometer against the last completed record of each PM level.

export type PMLevel = {
  code: string;
  label: string;
  intervalKm: number | null; // null = time-based (daily), not km-based
  summary: string;
  tasks: string[];
};

export const FAW_PLAN: PMLevel[] = [
  {
    code: "PM-A",
    label: "Daily Inspection",
    intervalKm: null,
    summary: "Driver/mechanic signs before dispatch",
    tasks: [
      "Engine oil level", "Coolant level", "Brake air pressure", "Brake operation",
      "Air tanks drained", "Steering play", "Suspension", "Air leaks", "Engine leaks",
      "Fuel leaks", "Lights", "Indicators", "Reverse lights", "Horn", "Wipers",
      "Tires", "Wheel nuts", "Fifth wheel", "Trailer airlines", "Fire extinguisher",
      "First aid kit",
    ],
  },
  {
    code: "PM-B",
    label: "5,000 km Service",
    intervalKm: 5000,
    summary: "Light service — lubrication & checks",
    tasks: [
      "Grease chassis nipples", "Check engine oil condition", "Check all fluid levels",
      "Inspect tires & pressures", "Check lights & electrics", "Drain air tanks",
    ],
  },
  {
    code: "PM-C",
    label: "10,000 km Service",
    intervalKm: 10000,
    summary: "Oil service",
    tasks: [
      "Replace engine oil", "Replace oil filter", "Inspect air filter",
      "Inspect fuel filters", "Inspect turbo hoses", "Inspect fan belts",
      "Check batteries", "Check brake adjustment", "Inspect steering linkage",
      "Inspect propeller shaft", "Grease chassis", "Check suspension bolts",
    ],
  },
  {
    code: "PM-D",
    label: "20,000 km Service",
    intervalKm: 20000,
    summary: "Oil service + fuel system",
    tasks: [
      "All PM-C items", "Replace primary fuel filter", "Drain water separator",
      "Check transmission oil", "Check differential oil", "Inspect brake shoes",
      "Inspect slack adjusters", "Check wheel bearings", "Inspect king pins",
    ],
  },
  {
    code: "PM-E",
    label: "40,000 km Service",
    intervalKm: 40000,
    summary: "Filters + air system",
    tasks: [
      "Replace secondary fuel filter", "Replace air dryer cartridge",
      "Inspect turbocharger", "Inspect clutch", "Check engine mounts",
      "Inspect radiator", "Pressure test cooling system",
    ],
  },
  {
    code: "PM-F",
    label: "60,000 km Service",
    intervalKm: 60000,
    summary: "Extended inspection",
    tasks: [
      "All PM-E items", "Replace air filter", "Inspect exhaust system",
      "Check cab mounts", "Inspect fifth wheel wear", "Check ABS sensors",
    ],
  },
  {
    code: "PM-G",
    label: "100,000 km Service",
    intervalKm: 100000,
    summary: "Major inspection",
    tasks: [
      "Replace differential oil", "Replace transmission oil (if applicable)",
      "Wheel bearing inspection", "Suspension alignment", "Full brake inspection",
      "Injector testing", "Cooling system inspection",
    ],
  },
  {
    code: "MAJOR",
    label: "200,000 km Major Service",
    intervalKm: 200000,
    summary: "Major overhaul service",
    tasks: [
      "All PM-G items", "Clutch kit assessment", "Water pump & thermostat",
      "Alternator & belts", "Brake chambers", "Full driveline inspection",
      "Engine top-end inspection",
    ],
  },
];

// Km-based levels only (PM-A is daily and handled as a checklist, not km)
export const KM_LEVELS = FAW_PLAN.filter((p): p is PMLevel & { intervalKm: number } => p.intervalKm !== null);

export type DueService = {
  code: string;
  label: string;
  intervalKm: number;
  lastAtKm: number | null;
  dueAtKm: number;
  kmRemaining: number; // negative = overdue
};

// Compute the next due km for every PM level given the truck's odometer and
// the last completed km of each level. A level never serviced is measured
// from km 0 (i.e. due at its first interval).
export function computeDueServices(
  odometerKm: number,
  lastByCode: Record<string, number | undefined>,
): DueService[] {
  return KM_LEVELS.map((level) => {
    const lastAtKm = lastByCode[level.code] ?? null;
    const base = lastAtKm ?? 0;
    const dueAtKm = base + level.intervalKm;
    return {
      code: level.code,
      label: level.label,
      intervalKm: level.intervalKm,
      lastAtKm,
      dueAtKm,
      kmRemaining: dueAtKm - odometerKm,
    };
  }).sort((a, b) => a.kmRemaining - b.kmRemaining);
}

// The single most urgent upcoming/overdue service for a truck
export function nextDueService(
  odometerKm: number,
  lastByCode: Record<string, number | undefined>,
): DueService | null {
  const due = computeDueServices(odometerKm, lastByCode);
  return due[0] ?? null;
}
