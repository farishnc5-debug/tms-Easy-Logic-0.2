// One-time migration: replaces AL-RAWASI (dummy) with Yalla Muv Company as the
// tenant CompanyProfile, and onboards TASARU Logistics as a vendor with its
// real rate card + the two source quotation documents attached.
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const db = new PrismaClient();
const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");

function saveLocalFile(srcPath, folder) {
  const buf = fs.readFileSync(srcPath);
  const id = crypto.randomBytes(12).toString("hex");
  const dir = path.join(STORAGE_ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${id}.pdf`), buf);
  return `/api/files/${folder}/${id}.pdf`;
}

(async () => {
  // 1) Replace AL-RAWASI with Yalla Muv Company as the tenant identity —
  // legal name exactly as it appears on the CR certificate.
  const existing = await db.companyProfile.findFirst();
  const companyData = {
    name: "Yalla Muv Company",
    nameAr: "شركة يلا موف",
    tagline: "Logistics & Freight Solutions",
    crNumber: "7054030577",
    vatNumber: "314724412300003",
    phone: "+966 50 987 9256",
    phone2: null,
    email: null,
    website: null,
    address: "Al Rehab District",
    city: "Jeddah",
    country: "Saudi Arabia",
    // No real bank details supplied yet — clear the old AL-RAWASI dummy values
    bankName: null,
    bankAccount: null,
    bankIban: null,
    bankBeneficiary: null,
    logoDataUrl: null,
  };
  const company = existing
    ? await db.companyProfile.update({ where: { id: existing.id }, data: companyData })
    : await db.companyProfile.create({ data: companyData });
  console.log("Company profile set to:", company.name, "| CR:", company.crNumber, "| VAT:", company.vatNumber);

  // 2) Onboard TASARU Logistics as a vendor (subcontracted transporter)
  let tasaru = await db.customer.findFirst({ where: { name: "TASARU Logistics & Transport Company" } });
  const tasaruData = {
    name: "TASARU Logistics & Transport Company",
    nameAr: "شركة تسارع للخدمات اللوجستية والنقل",
    contactPerson: "Shahad Tariq — Sales Representative",
    phone: "+966 54 717 3492",
    address: "Al-Rehab District, Prince Mit'eb Street, P.O. Box 50334, Jeddah 21523",
    isVendor: true,
  };
  tasaru = tasaru
    ? await db.customer.update({ where: { id: tasaru.id }, data: tasaruData })
    : await db.customer.create({ data: tasaruData });
  console.log("Vendor created/updated:", tasaru.name, tasaru.id);

  // 3) Attach the two source documents to TASARU's vendor profile
  const docs = [
    {
      src: "C:/Users/free/OneDrive/Desktop/yalla muv/Transportation proposal Tasaru عرض سعر تسارع  (Yalla Muv Company) .pdf",
      name: "TASARU Transportation Proposal & Trading Agreement (06/08/2026)",
    },
    {
      src: "C:/Users/free/OneDrive/Desktop/yalla muv/TASARU_Quotation_English_Translation_and_Analysis.pdf",
      name: "TASARU Quotation — English Translation & Analysis",
    },
  ];
  // Avoid duplicating on re-run
  await db.document.deleteMany({ where: { customerId: tasaru.id } });
  for (const d of docs) {
    if (!fs.existsSync(d.src)) {
      console.warn("Missing source file, skipped:", d.src);
      continue;
    }
    const stat = fs.statSync(d.src);
    const url = saveLocalFile(d.src, "vendors");
    await db.document.create({
      data: {
        name: d.name,
        fileType: "application/pdf",
        dataUrl: url,
        sizeKb: Math.round((stat.size / 1024) * 10) / 10,
        customerId: tasaru.id,
      },
    });
    console.log("Attached document:", d.name);
  }

  // 4) TASARU's real rate card — 8 lanes from Jeddah Port, quoted for both
  // 20ft and 40ft containers at the same rate (per the actual quotation).
  const LANES = [
    ["Jeddah Port", "Al-Khomrah", 550],
    ["Jeddah Port", "Riyadh", 3500],
    ["Jeddah Port", "Dammam", 5000],
    ["Jeddah Port", "Yanbu", 2200],
    ["Jeddah Port", "Rabigh", 1600],
    ["Jeddah Port", "Al-Ahsa", 4500],
    ["Jeddah Port", "Makkah", 1400],
    ["Jeddah Port", "Al-Madinah", 2500],
  ];
  const CONTAINER_TYPES = ["CONTAINER_20", "CONTAINER_40"];

  await db.carrierRate.deleteMany({ where: { vendorId: tasaru.id } });
  let count = 0;
  for (const [origin, dest, cost] of LANES) {
    for (const vehicleType of CONTAINER_TYPES) {
      await db.carrierRate.create({
        data: {
          vendorId: tasaru.id,
          originCity: origin,
          destinationCity: dest,
          vehicleType,
          carrierCost: cost,
          currency: "SAR",
          isActual: true,
          notes: "From TASARU official quotation dated 06/08/2026 — round trip, excl. VAT",
        },
      });
      count++;
    }
  }
  console.log(`Seeded ${count} TASARU tariff rows (8 lanes × 2 container sizes)`);

  await db.$disconnect();
})();
