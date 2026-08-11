// Removes ALL demo/example operating data so the system starts empty for real
// use. Login accounts and the company profile are intentionally preserved.
// A database backup is taken by the caller before this runs.
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

(async () => {
  const removed = {};
  // children first, then parents (respects foreign keys)
  removed.invoiceCharges = (await db.invoiceCharge.deleteMany({})).count;
  removed.invoices = (await db.invoice.deleteMany({})).count;
  removed.settlements = (await db.settlement.deleteMany({})).count;
  removed.deliveryStops = (await db.deliveryStop.deleteMany({})).count;
  removed.pods = (await db.proofOfDelivery.deleteMany({})).count;
  removed.documents = (await db.document.deleteMany({})).count;
  removed.incidents = (await db.incident.deleteMany({})).count;
  removed.tasks = (await db.task.deleteMany({})).count;
  removed.vehicleLocations = (await db.vehicleLocation.deleteMany({})).count;
  removed.gpsDevices = (await db.gPSDevice.deleteMany({})).count;
  removed.maintenanceRecords = (await db.maintenanceRecord.deleteMany({})).count;
  removed.trips = (await db.trip.deleteMany({})).count;
  removed.shipments = (await db.shipment.deleteMany({})).count;
  removed.quotations = (await db.quotation.deleteMany({})).count;
  removed.customerRates = (await db.customerRate.deleteMany({})).count;
  removed.customers = (await db.customer.deleteMany({})).count;
  removed.drivers = (await db.driver.deleteMany({})).count;
  removed.vehicles = (await db.vehicle.deleteMany({})).count;
  removed.alerts = (await db.alert.deleteMany({})).count;
  removed.auditLogs = (await db.auditLog.deleteMany({})).count;

  console.log(JSON.stringify({ removed }, null, 1));
  await db.$disconnect();
})();
