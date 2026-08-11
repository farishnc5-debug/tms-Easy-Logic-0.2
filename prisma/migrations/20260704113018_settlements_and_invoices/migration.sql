-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DOCS_WITH_DRIVER',
    "docsReceivedAt" DATETIME,
    "handedToAccountsAt" DATETIME,
    "invoicedAt" DATETIME,
    "paymentDueAt" DATETIME,
    "paidAt" DATETIME,
    "paymentTerms" TEXT NOT NULL DEFAULT 'CASH',
    "creditDays" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Settlement_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "vatPct" REAL NOT NULL DEFAULT 15,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "Invoice_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "company" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "crNumber" TEXT,
    "vatNumber" TEXT,
    "crDocName" TEXT,
    "crDocDataUrl" TEXT,
    "vatDocName" TEXT,
    "vatDocDataUrl" TEXT,
    "paymentTerms" TEXT NOT NULL DEFAULT 'CASH',
    "creditDays" INTEGER,
    "isVendor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Customer" ("address", "company", "contactPerson", "crDocDataUrl", "crDocName", "crNumber", "createdAt", "email", "id", "isVendor", "name", "nameAr", "phone", "updatedAt", "vatDocDataUrl", "vatDocName", "vatNumber") SELECT "address", "company", "contactPerson", "crDocDataUrl", "crDocName", "crNumber", "createdAt", "email", "id", "isVendor", "name", "nameAr", "phone", "updatedAt", "vatDocDataUrl", "vatDocName", "vatNumber" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_shipmentId_key" ON "Settlement"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_code_key" ON "Invoice"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_settlementId_key" ON "Invoice"("settlementId");
