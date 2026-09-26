# Deploying Easy Logic to the web (Vercel + Neon + Blob)

Everything below has a free tier to start. Total time: about 30 minutes.

## What runs where
| Piece | Service | Why |
|---|---|---|
| The website | **Vercel** | Built for Next.js, HTTPS included |
| Database | **Neon** (PostgreSQL) | Replaces the local `dev.db` file |
| Uploaded files (CR/VAT, POD photos) | **Vercel Blob** | Vercel's disk is temporary |
| Code | **GitHub** | Vercel deploys from it on every push |

## 1. Push the code to GitHub
Create an **empty private repository** (no README), then in the project folder:
```bash
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

## 2. Create the services (in the Vercel dashboard)
1. **Vercel** → *Add New → Project* → import the GitHub repo. **Do not deploy yet.**
2. Project → **Storage** → *Create* → **Neon (Postgres)**. Pick the region closest to Saudi Arabia
   (Frankfurt or the nearest Middle East option). This adds `DATABASE_URL` and
   `DATABASE_URL_UNPOOLED` for you.
3. Project → **Storage** → *Create* → **Blob**. This adds `BLOB_READ_WRITE_TOKEN`.

## 3. Add the secrets
Generate three random values on your PC (run each once, copy the output):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```
Project → **Settings → Environment Variables**, add:
| Name | Value |
|---|---|
| `SESSION_SECRET` | random value #1 |
| `APP_ENCRYPTION_KEY` | random value #2 — **never change it later** (it protects saved integration passwords and the ZATCA key) |
| `CRON_SECRET` | random value #3 |

Optional: `GPS_SERVER_URL`, `GPS_USERNAME`, `GPS_PASSWORD` for Tracking Maps.

## 4. Deploy
Click **Deploy**. The build creates the database tables automatically
(`scripts/vercel-build.js`). You'll get a `https://<name>.vercel.app` address.

## 5. Move your existing data (one time)
Run these on your PC, in the project folder, **before** using the live site:
```bash
# 1) export local data (still on SQLite)
node scripts/db-export.js

# 2) point at Neon and import (copy DATABASE_URL_UNPOOLED from Vercel → Settings → Env Vars)
node scripts/switch-db.js postgresql
#   set DATABASE_URL to the Neon URL in .env  (keep your old line commented out!)
npx prisma generate
node scripts/db-import.js

# 3) put things back for local work
node scripts/switch-db.js sqlite
#   restore DATABASE_URL="file:./dev.db" in .env
npx prisma generate

# 4) upload existing files to Blob
BLOB_READ_WRITE_TOKEN=<from Vercel> node scripts/upload-files-to-blob.js
```
Delete `data-export.json` afterwards (it contains all your business data).

## 6. First login — do this immediately
The imported admin still has the old password. Sign in and change it under
**Settings → My Profile**, and create real accounts for your team under **Users & Roles**.

## 7. Your own domain (optional)
Vercel → Project → **Domains** → add e.g. `tms.yourcompany.com` and follow the DNS instructions.

## Limits to know about
- **Uploads:** Vercel rejects requests over ~4.5 MB. Photos/PDFs above about 4 MB fail to upload
  (the form limit is set to 4 MB). Large phone photos may need to be resized first.
- **Daily job:** Vercel's free plan runs the scheduled job once a day. Live GPS refresh needs a paid
  plan or an external scheduler calling `/api/cron/maintenance` with `Authorization: Bearer <CRON_SECRET>`.
- **WhatsApp replies** now work: set the webhook in Meta's dashboard to
  `https://<your-domain>/api/webhooks/whatsapp`.
- **Backups:** Neon keeps short point-in-time history on the free plan. Export regularly with
  `node scripts/db-export.js` (with `DATABASE_URL` pointing at Neon) until you upgrade.
- **Updates:** every push to `main` redeploys automatically. Schema changes are applied by the
  build; destructive changes will stop the build rather than delete data.
