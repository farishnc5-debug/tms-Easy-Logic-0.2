-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "tagline" TEXT,
    "crNumber" TEXT,
    "vatNumber" TEXT,
    "phone" TEXT,
    "phone2" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'Saudi Arabia',
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankIban" TEXT,
    "bankBeneficiary" TEXT,
    "logoDataUrl" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "originName" TEXT NOT NULL,
    "destinationName" TEXT NOT NULL,
    "tripType" TEXT NOT NULL DEFAULT 'ONE_WAY',
    "vehicleType" TEXT,
    "cargoDescription" TEXT,
    "weightKg" REAL,
    "priceAmount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "vatPct" REAL NOT NULL DEFAULT 15,
    "validUntil" DATETIME,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_code_key" ON "Quotation"("code");
