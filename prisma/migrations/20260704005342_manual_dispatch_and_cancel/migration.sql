-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN "cancelReason" TEXT;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN "manualDriverName" TEXT;
ALTER TABLE "Trip" ADD COLUMN "manualDriverPhone" TEXT;
ALTER TABLE "Trip" ADD COLUMN "manualVehicle" TEXT;
