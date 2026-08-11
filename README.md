# Easy Logic — Intelligent Logistics OS

A full transportation management system (TMS): shipments, trips, dispatching,
fleet, drivers, customers/vendors, live map tracking, documents, incidents,
proof of delivery, users & roles, tasks, and reporting — all backed by a real
database.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (local file database, no external services required)
- Cookie-based session auth (bcrypt password hashing)
- Recharts for analytics, a custom stylized SVG live map (no API key needed)

## Getting Started

```bash
npm install
npm run db:seed      # populates the database with demo data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to
`/login`.

### Demo credentials

| Email | Password | Role |
|---|---|---|
| faris@easylogic.sa | password123 | Admin / Operations Manager |
| layla@easylogic.sa | password123 | Dispatcher |
| omar@easylogic.sa | password123 | Viewer |

## Database

SQLite database lives at `prisma/dev.db`. To reset and reseed:

```bash
rm prisma/dev.db
npx prisma migrate dev
npm run db:seed
```

Inspect data with `npm run db:studio` (Prisma Studio).

## Modules

- **Dashboard** — logistics cycle stepper, live current trip map, fleet/shipment breakdowns, alerts
- **Shipments** — full CRUD, dispatch workflow, cycle tracking
- **Trips** — live map + selected trip panel, status progression, driver/vehicle reassignment
- **Dispatching** — pending queue with available driver/vehicle assignment
- **Fleet / Drivers / Customers & Vendors** — full CRUD
- **Map Tracking** — full-screen live map of all active trips
- **Logistics Cycle** — kanban view of shipments by pipeline stage
- **Tasks & Activities** — kanban task board
- **Documents** — file upload/download linked to shipments/trips
- **Incidents** — report and resolve issues linked to trips
- **POD & Proof** — confirm delivery with receiver name/photo/notes
- **Users & Roles**, **Settings**, **Reports & Analytics**
