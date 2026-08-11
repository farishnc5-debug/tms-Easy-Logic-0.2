-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN "destX" REAL;
ALTER TABLE "Shipment" ADD COLUMN "destY" REAL;
ALTER TABLE "Shipment" ADD COLUMN "destinationAddress" TEXT;
ALTER TABLE "Shipment" ADD COLUMN "originAddress" TEXT;
ALTER TABLE "Shipment" ADD COLUMN "originX" REAL;
ALTER TABLE "Shipment" ADD COLUMN "originY" REAL;
