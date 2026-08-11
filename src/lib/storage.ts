import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { put, list } from "@vercel/blob";

// Files are NOT stored inside the database — only the serving path
// (/api/files/...) is stored, which keeps the DB small.
//
// Locally (no BLOB_READ_WRITE_TOKEN set) they live on disk under
// storage/uploads/<folder>/, exactly as before.
// In production on Vercel (BLOB_READ_WRITE_TOKEN set), they live in Vercel
// Blob storage instead, since Vercel's filesystem is read-only/ephemeral.
// Every caller (trips.ts, pod.ts, customers.ts, documents.ts, the
// /api/files route) is unaffected — the returned URL shape never changes.
const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

function safeExt(file: File) {
  const fromMime = EXT_BY_MIME[file.type];
  if (fromMime) return fromMime;
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  return /^[a-z0-9]{1,5}$/.test(fromName) ? fromName : "bin";
}

async function writeBytes(folder: string, filename: string, buf: Buffer, contentType?: string) {
  const pathname = `${folder}/${filename}`;
  if (useBlob) {
    await put(pathname, buf, {
      access: "public",
      addRandomSuffix: false,
      contentType,
    });
  } else {
    const dir = path.join(STORAGE_ROOT, folder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buf);
  }
  return `/api/files/${pathname}`;
}

// Save an uploaded File. Returns the URL path to store in the DB — it works
// directly in <img src> and <a href> just like a data-URL did.
export async function saveUpload(file: File, folder: string): Promise<string> {
  const id = crypto.randomBytes(12).toString("hex");
  const ext = safeExt(file);
  const buf = Buffer.from(await file.arrayBuffer());
  return writeBytes(folder, `${id}.${ext}`, buf, file.type || undefined);
}

// Save an existing data-URL string (used by the one-time migration).
export async function saveDataUrl(dataUrl: string, folder: string): Promise<string | null> {
  const m = dataUrl.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (!m) return null;
  const [, mime, b64] = m;
  const ext = EXT_BY_MIME[mime] ?? "bin";
  const id = crypto.randomBytes(12).toString("hex");
  return writeBytes(folder, `${id}.${ext}`, Buffer.from(b64, "base64"), mime);
}

// Read a stored file back (for the serving route). Rejects path traversal.
export async function readStoredFile(folder: string, name: string) {
  if (!/^[a-z0-9-]+$/i.test(folder) || !/^[a-z0-9]+\.[a-z0-9]{1,5}$/i.test(name)) {
    return null;
  }
  const ext = name.split(".").pop()!.toLowerCase();
  const mime = Object.entries(EXT_BY_MIME).find(([, e]) => e === ext)?.[0] ?? "application/octet-stream";

  if (useBlob) {
    const { blobs } = await list({ prefix: `${folder}/${name}`, limit: 1 });
    const blob = blobs[0];
    if (!blob) return null;
    const res = await fetch(blob.url);
    if (!res.ok) return null;
    return { data: Buffer.from(await res.arrayBuffer()), mime };
  }

  const filePath = path.join(STORAGE_ROOT, folder, name);
  try {
    return { data: await readFile(filePath), mime };
  } catch {
    return null;
  }
}
