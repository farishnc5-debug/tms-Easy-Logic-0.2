import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readStoredFile } from "@/lib/storage";

// Serves uploaded files (CR/VAT docs, POD photos, documents) to logged-in
// users only. Files live on disk under storage/uploads/.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ folder: string; name: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { folder, name } = await params;
  const file = await readStoredFile(folder, name);
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
