import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { coordFor } from "../src/lib/constants";

const db = new PrismaClient();

const DRIVERS = [
  { name: "Ali Hassan", phone: "+966 50 123 4567", license: "DL-88213", rating: 4.8 },
  { name: "Mohammed Y.", phone: "+966 55 987 6543", license: "DL-77124", rating: 4.6 },
  { name: "Khalid Alharbi", phone: "+966 53 246 1357", license: "DL-99871", rating: 4.7 },
  { name: "Ahmed Raza", phone: "+966 54 778 8899", license: "DL-65442", rating: 4.9 },
  { name: "Faisal Khan", phone: "+966 50 112 3344", license: "DL-45210", rating: 4.5 },
  { name: "Yusuf Malik", phone: "+966 58 445 6677", license: "DL-31908", rating: 4.8 },
  { name: "Omar Saleh", phone: "+966 51 889 2233", license: "DL-20456", rating: 4.4 },
  { name: "Hassan Qureshi", phone: "+966 56 334 1122", license: "DL-88012", rating: 4.6 },
  { name: "Tariq Aziz", phone: "+966 57 221 9988", license: "DL-19233", rating: 4.3 },
];

const VEHICLES = [
  { plate: "KSA-1234", type: "Trailer 40FT", cap: 25 },
  { plate: "KSA-5678", type: "Flatbed 20FT", cap: 15 },
  { plate: "KSA-9101", type: "Box Truck", cap: 8 },
  { plate: "KSA-2222", type: "Trailer 40FT", cap: 25 },
  { plate: "KSA-3333", type: "Refrigerated 20FT", cap: 12 },
  { plate: "KSA-4444", type: "Flatbed 40FT", cap: 28 },
  { plate: "KSA-5555", type: "Box Truck", cap: 8 },
  { plate: "KSA-6666", type: "Van", cap: 3 },
  { plate: "KSA-7777", type: "Trailer 40FT", cap: 25 },
];

const CUSTOMERS = [
  { name: "Al Madina Trading", company: "Al Madina Trading Co.", phone: "+966 50 123 4567" },
  { name: "Zam Zam Logistics", company: "Zam Zam Logistics LLC", phone: "+966 55 987 6543" },
  { name: "Arabian Essentials", company: "Arabian Essentials Trading", phone: "+966 53 246 1357" },
  { name: "Gulf Tech Co.", company: "Gulf Tech Co.", phone: "+966 54 778 8899" },
  { name: "Modern Market", company: "Modern Market Retail", phone: "+966 50 112 3344" },
  { name: "Al Noor Stores", company: "Al Noor Stores Group", phone: "+966 58 445 6677" },
  { name: "Saudi Pharma", company: "Saudi Pharma Distribution", phone: "+966 51 889 2233" },
  { name: "Red Sea Foods", company: "Red Sea Foods Co.", phone: "+966 56 334 1122" },
  { name: "Najd Electronics", company: "Najd Electronics LLC", phone: "+966 57 221 9988" },
];

const VENDORS = [
  { name: "Fuel Partners KSA", company: "Fuel Partners KSA", phone: "+966 59 100 2001" },
  { name: "TireCare Riyadh", company: "TireCare Riyadh", phone: "+966 59 100 2002" },
];

const ROUTES = [
  { origin: "Jeddah Warehouse", destination: "Riyadh DC", distance: 950 },
  { origin: "Dammam Port", destination: "Jeddah Warehouse", distance: 1340 },
  { origin: "Riyadh DC", destination: "Jeddah Customer", distance: 950 },
  { origin: "Jeddah Warehouse", destination: "Dammam DC", distance: 1340 },
  { origin: "Riyadh DC", destination: "Dammam Customer", distance: 400 },
  { origin: "Dammam Port", destination: "Riyadh DC", distance: 400 },
  { origin: "Jeddah Warehouse", destination: "Riyadh Hospital", distance: 950 },
  { origin: "Madinah Hub", destination: "Riyadh DC", distance: 850 },
  { origin: "Riyadh DC", destination: "Qassim Depot", distance: 340 },
  { origin: "Jubail Terminal", destination: "Dammam Customer", distance: 90 },
];

const STATUS_FLOW = [
  "PENDING",
  "DISPATCHED",
  "COLLECTING",
  "IN_TRANSIT",
  "AT_DELIVERY",
  "DELIVERED",
] as const;

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

async function main() {
  console.log("Seeding database...");

  await db.alert.deleteMany();
  await db.proofOfDelivery.deleteMany();
  await db.document.deleteMany();
  await db.incident.deleteMany();
  await db.trip.deleteMany();
  await db.shipment.deleteMany();
  await db.customer.deleteMany();
  await db.driver.deleteMany();
  await db.vehicle.deleteMany();
  await db.session.deleteMany();
  await db.user.deleteMany();

  // Company profile (single row) — printed on all documents
  const existingCompany = await db.companyProfile.findFirst();
  if (!existingCompany) {
    await db.companyProfile.create({
      data: {
        name: "Al Rawasi Logistics",
        nameAr: "الرواسي للخدمات اللوجستية",
        tagline: "Road Freight & Logistics Services",
        crNumber: "1010XXXXXX",
        vatNumber: "3XXXXXXXXXXXXX3",
        phone: "+966 50 000 0000",
        email: "info@alrawasi-logistics.sa",
        website: "www.alrawasi-logistics.sa",
        address: "King Fahd Road, Industrial Area",
        city: "Riyadh",
        country: "Saudi Arabia",
        bankName: "Al Rajhi Bank",
        bankBeneficiary: "Al Rawasi Logistics Co.",
        bankIban: "SA00 0000 0000 0000 0000 0000",
        bankAccount: "000000000000",
      },
    });
  }

  // Users
  const passwordHash = await bcrypt.hash("password123", 10);
  await db.user.create({
    data: {
      name: "Faris Khan",
      email: "faris.hnc5@gmail.com",
      passwordHash,
      role: "ADMIN",
      title: "Operations Manager",
      phone: "+966 50 000 1111",
      avatarSeed: "faris",
    },
  });
  await db.user.create({
    data: {
      name: "Layla Ahmed",
      email: "faris.hnc6@gmail.com",
      passwordHash,
      role: "DISPATCHER",
      title: "Dispatch Coordinator",
      phone: "+966 50 000 2222",
      avatarSeed: "layla",
    },
  });
  await db.user.create({
    data: {
      name: "Omar Nasser",
      email: "faris.hnc7@gmail.com",
      passwordHash,
      role: "VIEWER",
      title: "Finance Analyst",
      phone: "+966 50 000 3333",
      avatarSeed: "omar",
    },
  });

  // Vehicles
  const vehicles = [];
  for (const v of VEHICLES) {
    const status = rand(["AVAILABLE", "AVAILABLE", "ON_TRIP", "ON_TRIP", "MAINTENANCE", "OFFLINE"]);
    vehicles.push(
      await db.vehicle.create({
        data: { plateNumber: v.plate, vehicleType: v.type, capacityTon: v.cap, status },
      }),
    );
  }

  // Drivers
  const drivers = [];
  for (let i = 0; i < DRIVERS.length; i++) {
    const d = DRIVERS[i];
    const vehicle = vehicles[i % vehicles.length];
    drivers.push(
      await db.driver.create({
        data: {
          name: d.name,
          phone: d.phone,
          email: `${d.name.toLowerCase().replace(/[^a-z]+/g, ".")}@easylogic.sa`,
          licenseNumber: d.license,
          rating: d.rating,
          status: rand(["AVAILABLE", "ON_TRIP", "ON_TRIP", "OFF_DUTY"]),
          avatarSeed: d.name,
          vehicleId: vehicle.id,
        },
      }),
    );
  }

  // Customers + vendors
  const customers = [];
  for (const c of CUSTOMERS) {
    customers.push(
      await db.customer.create({
        data: {
          name: c.name,
          company: c.company,
          phone: c.phone,
          email: `contact@${c.company.toLowerCase().replace(/[^a-z]+/g, "")}.sa`,
          address: `${rand(["Industrial Area", "Business District", "Port Road", "King Fahd Rd"])}, ${rand(["Jeddah", "Riyadh", "Dammam"])}, Saudi Arabia`,
          isVendor: false,
        },
      }),
    );
  }
  for (const v of VENDORS) {
    await db.customer.create({
      data: {
        name: v.name,
        company: v.company,
        phone: v.phone,
        email: `contact@${v.company.toLowerCase().replace(/[^a-z]+/g, "")}.sa`,
        address: "Riyadh, Saudi Arabia",
        isVendor: true,
      },
    });
  }

  // Shipments + Trips
  let seq = 118;
  const now = Date.now();
  const totalShipments = 128;
  const activeCount = 40; // shipments with a linked trip in progress/complete

  for (let i = 0; i < totalShipments; i++) {
    const code = `SHP-2025-${String(seq + i).padStart(5, "0")}`;
    const tripCode = `TRP-2025-${String(seq + i).padStart(6, "0")}`;
    const customer = rand(customers);
    const route = rand(ROUTES);
    const priority = rand(["STANDARD", "STANDARD", "EXPRESS", "OVERNIGHT"]);

    let status: (typeof STATUS_FLOW)[number] | "DELAYED";
    const roll = Math.random();
    if (roll < 0.11) status = "PENDING";
    else if (roll < 0.19) status = "DISPATCHED";
    else if (roll < 0.28) status = "COLLECTING";
    else if (roll < 0.55) status = "IN_TRANSIT";
    else if (roll < 0.65) status = "AT_DELIVERY";
    else if (roll < 0.97) status = "DELIVERED";
    else status = "DELAYED";

    const cycleStage = STATUS_FLOW.indexOf(status === "DELAYED" ? "IN_TRANSIT" : status) + 1;

    const shipment = await db.shipment.create({
      data: {
        code,
        customerId: customer.id,
        originName: route.origin,
        destinationName: route.destination,
        priority,
        status,
        cycleStage,
        weightKg: randInt(200, 24000),
        createdAt: new Date(now - randInt(0, 7) * 86400000),
      },
    });

    if (i < activeCount || status !== "PENDING") {
      const driver = rand(drivers);
      const vehicle = vehicles.find((v) => v.id === driver.vehicleId) ?? rand(vehicles);
      const origin = coordFor(route.origin);
      const dest = coordFor(route.destination);

      let progress = 0;
      if (status === "DISPATCHED") progress = randInt(5, 15);
      else if (status === "COLLECTING") progress = randInt(15, 35);
      else if (status === "IN_TRANSIT") progress = randInt(35, 75);
      else if (status === "AT_DELIVERY") progress = randInt(75, 90);
      else if (status === "DELIVERED") progress = 100;
      else if (status === "DELAYED") progress = randInt(40, 70);

      const t = progress / 100;
      const currentX = lerp(origin.x, dest.x, t);
      const currentY = lerp(origin.y, dest.y, t);

      const departureAt = new Date(now - randInt(0, 2) * 86400000 - randInt(0, 12) * 3600000);
      const etaAt = new Date(departureAt.getTime() + randInt(4, 14) * 3600000);

      await db.trip.create({
        data: {
          code: tripCode,
          shipmentId: shipment.id,
          driverId: driver.id,
          vehicleId: vehicle.id,
          originName: route.origin,
          originX: origin.x,
          originY: origin.y,
          destinationName: route.destination,
          destX: dest.x,
          destY: dest.y,
          currentX,
          currentY,
          status,
          progressPct: progress,
          distanceKm: route.distance,
          statusNote:
            status === "DELAYED"
              ? "Traffic Issue"
              : status === "IN_TRANSIT"
                ? "On the way"
                : status === "COLLECTING"
                  ? "Loading"
                  : status === "DISPATCHED"
                    ? "Assigned"
                    : status === "AT_DELIVERY"
                      ? "Arrived"
                      : status === "DELIVERED"
                        ? "Completed"
                        : "Waiting",
          departureAt,
          etaAt,
          dispatchedAt: departureAt,
          collectingAt: cycleStage >= 2 ? new Date(departureAt.getTime() + 20 * 60000) : null,
          inTransitAt: cycleStage >= 3 ? new Date(departureAt.getTime() + 80 * 60000) : null,
          atDeliveryAt: cycleStage >= 4 ? new Date(departureAt.getTime() + 5 * 3600000) : null,
          deliveredAt: cycleStage >= 5 ? new Date(departureAt.getTime() + 6 * 3600000) : null,
        },
      });

      if (status === "DELAYED") {
        await db.incident.create({
          data: {
            title: "Traffic congestion on route",
            description: `Trip ${tripCode} delayed due to heavy traffic congestion en route to ${route.destination}.`,
            severity: "MEDIUM",
            status: "OPEN",
          },
        });
      }
    }
  }

  // link a couple of incidents/alerts/documents/pod to real trips for richer demo data
  const someTrips = await db.trip.findMany({ take: 15 });
  for (const trip of someTrips.slice(0, 3)) {
    await db.incident.create({
      data: {
        tripId: trip.id,
        title: "Delay Reported",
        description: `${trip.code} is delayed`,
        severity: "LOW",
        status: "OPEN",
      },
    });
  }
  if (someTrips[3]) {
    await db.proofOfDelivery.create({
      data: {
        shipmentId: someTrips[3].shipmentId,
        receivedBy: "Warehouse Supervisor",
        notes: "Delivered in good condition, 2 pallets.",
      },
    });
  }

  await db.alert.createMany({
    data: [
      { type: "DELAY", message: "Delay reported on an active trip", severity: "WARNING" },
      { type: "TRAFFIC", message: "Traffic congestion on route to Riyadh", severity: "WARNING" },
      { type: "POD", message: "2 deliveries pending proof of delivery", severity: "INFO" },
      { type: "MAINTENANCE", message: "Vehicle KSA-3333 due for maintenance", severity: "INFO" },
    ],
  });

  console.log("Seed complete.");
  console.log(`  Users:     3 (login: faris.hnc5@gmail.com / password123)`);
  console.log(`  Vehicles:  ${vehicles.length}`);
  console.log(`  Drivers:   ${drivers.length}`);
  console.log(`  Customers: ${customers.length + VENDORS.length}`);
  console.log(`  Shipments: ${totalShipments}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
