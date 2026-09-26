// One-time: copies your existing local uploads (storage/uploads/*) into Vercel
// Blob so documents already saved in the database keep working after deploy.
// Same paths are used, so no database changes are needed.
//   BLOB_READ_WRITE_TOKEN=... node scripts/upload-files-to-blob.js
const fs = require("fs");
const path = require("path");
const { put } = require("@vercel/blob");

const root = path.join(process.cwd(), "storage", "uploads");
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("Set BLOB_READ_WRITE_TOKEN first (Vercel → Storage → your Blob store → .env.local tab).");
  process.exit(1);
}
const MIME = { ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };

(async () => {
  let n = 0;
  for (const folder of fs.readdirSync(root)) {
    const dir = path.join(root, folder);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      await put(`${folder}/${file}`, fs.readFileSync(path.join(dir, file)), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: MIME[path.extname(file).toLowerCase()],
      });
      n++;
      console.log("uploaded", `${folder}/${file}`);
    }
  }
  console.log(`\nDone: ${n} files.`);
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
