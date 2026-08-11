-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "contactPerson" TEXT;
ALTER TABLE "Customer" ADD COLUMN "crDocDataUrl" TEXT;
ALTER TABLE "Customer" ADD COLUMN "crDocName" TEXT;
ALTER TABLE "Customer" ADD COLUMN "crNumber" TEXT;
ALTER TABLE "Customer" ADD COLUMN "nameAr" TEXT;
ALTER TABLE "Customer" ADD COLUMN "vatDocDataUrl" TEXT;
ALTER TABLE "Customer" ADD COLUMN "vatDocName" TEXT;
ALTER TABLE "Customer" ADD COLUMN "vatNumber" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "manualDriverName" TEXT,
    "manualDriverPhone" TEXT,
    "manualVehicle" TEXT,
    "driverAllowance" REAL,
    "allowancePaid" BOOLEAN NOT NULL DEFAULT false,
    "allowancePaidAt" DATETIME,
    "originName" TEXT NOT NULL,
    "originX" REAL NOT NULL,
    "originY" REAL NOT NULL,
    "destinationName" TEXT NOT NULL,
    "destX" REAL NOT NULL,
    "destY" REAL NOT NULL,
    "currentX" REAL,
    "currentY" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "distanceKm" REAL,
    "statusNote" TEXT,
    "departureAt" DATETIME,
    "etaAt" DATETIME,
    "dispatchedAt" DATETIME,
    "collectingAt" DATETIME,
    "inTransitAt" DATETIME,
    "atDeliveryAt" DATETIME,
    "deliveredAt" DATETIME,
    "leftDeliveryAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trip_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Trip" ("atDeliveryAt", "code", "collectingAt", "createdAt", "currentX", "currentY", "deliveredAt", "departureAt", "destX", "destY", "destinationName", "dispatchedAt", "distanceKm", "driverId", "etaAt", "id", "inTransitAt", "leftDeliveryAt", "manualDriverName", "manualDriverPhone", "manualVehicle", "originName", "originX", "originY", "progressPct", "shipmentId", "status", "statusNote", "updatedAt", "vehicleId") SELECT "atDeliveryAt", "code", "collectingAt", "createdAt", "currentX", "currentY", "deliveredAt", "departureAt", "destX", "destY", "destinationName", "dispatchedAt", "distanceKm", "driverId", "etaAt", "id", "inTransitAt", "leftDeliveryAt", "manualDriverName", "manualDriverPhone", "manualVehicle", "originName", "originX", "originY", "progressPct", "shipmentId", "status", "statusNote", "updatedAt", "vehicleId" FROM "Trip";
DROP TABLE "Trip";
ALTER TABLE "new_Trip" RENAME TO "Trip";
CREATE UNIQUE INDEX "Trip_code_key" ON "Trip"("code");
CREATE UNIQUE INDEX "Trip_shipmentId_key" ON "Trip"("shipmentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
