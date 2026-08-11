// Seeds the Carrier Tariff Book.
//
// Riyadh lanes use the negotiated anchors (Riyadh→Al Ahsa 600, Riyadh→Jeddah
// 1,700 are ACTUAL). Everything else is an ESTIMATE interpolated with the same
// pricing logic (~1.8 SAR/km on long haul, higher per-km on short haul, with
// allowances for deadhead/mountain routes) and is meant to be replaced with
// real quotes as they arrive.
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

// [destination, carrierCost, distanceKm, isActual]
const RIYADH = [
  ["Riyadh", 300, 60, false],
  ["Al Ahsa", 600, 320, true],
  ["Dammam", 700, 400, false],
  ["Khobar", 730, 420, false],
  ["Jubail", 800, 450, false],
  ["Buraydah", 600, 340, false],
  ["Unaizah", 580, 320, false],
  ["Hail", 950, 640, false],
  ["Bisha", 1150, 620, false],
  ["Taif", 1300, 750, false],
  ["Madinah", 1450, 850, false],
  ["Makkah", 1500, 870, false],
  ["Jeddah", 1700, 950, true],
  ["Yanbu", 1650, 900, false],
  ["Abha", 1800, 900, false],
  ["Khamis Mushait", 1850, 920, false],
  ["Najran", 1850, 950, false],
  ["Jazan", 2050, 1100, false],
  ["Tabuk", 2100, 1300, false],
  ["Arar", 1950, 1100, false],
  ["Sakaka", 2000, 1150, false],
];

const JEDDAH = [
  ["Jeddah", 300, 50, false],
  ["Makkah", 400, 85, false],
  ["Taif", 550, 170, false],
  ["Yanbu", 750, 330, false],
  ["Madinah", 850, 420, false],
  ["Bisha", 1050, 500, false],
  ["Abha", 1250, 620, false],
  ["Khamis Mushait", 1300, 640, false],
  ["Jazan", 1400, 710, false],
  ["Najran", 1600, 880, false],
  ["Buraydah", 1650, 900, false],
  ["Riyadh", 1700, 950, true],
  ["Hail", 1750, 1000, false],
  ["Tabuk", 1800, 1000, false],
  ["Al Ahsa", 2200, 1250, false],
  ["Dammam", 2300, 1350, false],
  ["Khobar", 2350, 1380, false],
  ["Jubail", 2400, 1400, false],
];

const DAMMAM = [
  ["Dammam", 300, 40, false],
  ["Khobar", 300, 20, false],
  ["Jubail", 400, 90, false],
  ["Al Ahsa", 500, 150, false],
  ["Riyadh", 700, 400, false],
  ["Buraydah", 1250, 750, false],
  ["Hail", 1500, 900, false],
  ["Arar", 1600, 900, false],
  ["Sakaka", 1650, 950, false],
  ["Taif", 2100, 1250, false],
  ["Madinah", 2150, 1250, false],
  ["Najran", 2250, 1250, false],
  ["Makkah", 2250, 1300, false],
  ["Jeddah", 2300, 1350, false],
  ["Abha", 2400, 1400, false],
  ["Khamis Mushait", 2450, 1420, false],
  ["Yanbu", 2500, 1500, false],
  ["Jazan", 2600, 1500, false],
  ["Tabuk", 2700, 1600, false],
];

const TABLES = [
  ["Riyadh", RIYADH],
  ["Jeddah", JEDDAH],
  ["Dammam", DAMMAM],
];

(async () => {
  await db.carrierRate.deleteMany({});
  const rows = [];
  for (const [origin, lanes] of TABLES) {
    for (const [dest, cost, km, isActual] of lanes) {
      rows.push({
        originCity: origin,
        destinationCity: dest,
        carrierCost: cost,
        distanceKm: km,
        isActual,
        notes: isActual
          ? "Negotiated rate confirmed with transporter"
          : "Estimate — replace with the transporter's quoted price",
      });
    }
  }
  await db.carrierRate.createMany({ data: rows });
  console.log(
    JSON.stringify(
      {
        seeded: rows.length,
        actuals: rows.filter((r) => r.isActual).length,
        estimates: rows.filter((r) => !r.isActual).length,
      },
      null,
      1,
    ),
  );
  await db.$disconnect();
})();
