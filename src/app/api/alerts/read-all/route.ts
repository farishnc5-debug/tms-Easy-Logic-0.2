import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  await db.alert.updateMany({ where: { read: false }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
