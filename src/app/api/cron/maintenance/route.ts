import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runGpsSync } from "@/lib/gps-sync";
import { submitInvoiceToZatca } from "@/lib/zatca/service";

// Scheduled housekeeping, triggered by Vercel Cron (see vercel.json) or any
// external scheduler. Protected by CRON_SECRET: the caller must send
//   Authorization: Bearer <CRON_SECRET>
// (Vercel does this automatically when CRON_SECRET is set in the project env).
function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed: no secret configured = job disabled
  const given = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const day = 24 * 3600_000;

  // 1) Pull fresh GPS positions (skipped cleanly if GPS isn't configured)
  const gps = await runGpsSync();

  // 2) Retry e-invoices that could not reach ZATCA (network errors). Simplified
  //    invoices must be reported within 24 hours, so this matters. Rejections
  //    are NOT retried — those need a human to fix the data.
  const stuck = await db.zatcaDocument.findMany({
    where: { status: "ERROR", docType: "INVOICE", createdAt: { gt: new Date(now.getTime() - 3 * day) } },
    select: { invoiceId: true },
    distinct: ["invoiceId"],
    take: 25,
  });
  let zatcaRetried = 0;
  for (const s of stuck) {
    const r = await submitInvoiceToZatca(s.invoiceId, "INVOICE").catch(() => null);
    if (r?.ok) zatcaRetried++;
  }

  // 3) Quotations past their validity date become EXPIRED
  const expired = await db.quotation.updateMany({
    where: { status: { in: ["DRAFT", "SENT"] }, validUntil: { lt: now } },
    data: { status: "EXPIRED" },
  });

  // 4) Housekeeping: expired sessions, old login-attempt rows, old GPS points
  const [sessions, attempts, points] = await Promise.all([
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - day) } } }),
    db.vehicleLocation.deleteMany({ where: { timestamp: { lt: new Date(now.getTime() - 30 * day) } } }),
  ]);

  return NextResponse.json({
    ok: true,
    gps,
    zatcaInvoicesRetried: zatcaRetried,
    quotationsExpired: expired.count,
    sessionsRemoved: sessions.count,
    loginAttemptsRemoved: attempts.count,
    gpsPointsRemoved: points.count,
  });
}
