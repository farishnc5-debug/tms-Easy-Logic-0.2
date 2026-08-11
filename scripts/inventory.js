// Reports what is currently stored, so we know exactly what a cleanup removes.
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

(async () => {
  const counts = {
    customers: await db.customer.count(),
    customerRates: await db.customerRate.count(),
    shipments: await db.shipment.count(),
    deliveryStops: await db.deliveryStop.count(),
    trips: await db.trip.count(),
    drivers: await db.driver.count(),
    vehicles: await db.vehicle.count(),
    quotations: await db.quotation.count(),
    invoices: await db.invoice.count(),
    invoiceCharges: await db.invoiceCharge.count(),
    settlements: await db.settlement.count(),
    documents: await db.document.count(),
    pods: await db.proofOfDelivery.count(),
    incidents: await db.incident.count(),
    tasks: await db.task.count(),
    alerts: await db.alert.count(),
    auditLogs: await db.auditLog.count(),
    maintenanceRecords: await db.maintenanceRecord.count(),
    gpsDevices: await db.gPSDevice.count(),
    vehicleLocations: await db.vehicleLocation.count(),
    users: await db.user.count(),
  };
  const company = await db.companyProfile.findFirst();
  const users = await db.user.findMany({ select: { name: true, email: true, role: true } });
  console.log(JSON.stringify({ counts, company: company?.name, users }, null, 1));
  await db.$disconnect();
})();
