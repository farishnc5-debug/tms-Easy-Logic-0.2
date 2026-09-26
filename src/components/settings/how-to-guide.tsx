import {
  Rocket,
  Landmark,
  Truck,
  Users,
  FileSignature,
  Package,
  Send,
  MapPin,
  BadgeCheck,
  BadgeDollarSign,
  BarChart3,
  Printer,
  Monitor,
  Globe,
  Database,
  ShieldCheck,
  Headset,
  Warehouse,
  Calculator,
  UserCog,
  CheckCircle2,
  Star,
  Crown,
  Gem,
} from "lucide-react";

function Section({
  icon: Icon,
  step,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-slate-400">{step}</p>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        </div>
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
  );
}

function Ol({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal space-y-1.5 pl-5">{children}</ol>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-slate-800">
      {children}
    </code>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-[#0b1b3a] p-3 font-mono text-xs leading-relaxed text-slate-100">
      {children}
    </pre>
  );
}

export function UsageGuide() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 text-sm text-brand-900">
        <p className="font-semibold">Welcome to your TMS — the complete operating manual.</p>
        <p className="mt-1">
          The sidebar is organised in the same order as your daily freight workflow:{" "}
          <strong>
            quote → book → dispatch → track → deliver & prove → collect payment
          </strong>
          . Follow the steps below in order the first time you set up, then use them as a
          reference.
        </p>
      </div>

      <Section icon={Rocket} step="STEP 1" title="First sign-in & your profile">
        <Ol>
          <li>
            Sign in with the email and password your administrator gave you.
          </li>
          <li>
            Go to <strong>Settings → My Profile</strong> and change your password immediately.
          </li>
          <li>
            Admins can add colleagues in <strong>Administration → Users & Roles</strong> — each
            person gets a role: Admin, Operations Manager, Dispatcher, Driver, or Viewer.
          </li>
        </Ol>
      </Section>

      <Section icon={Landmark} step="STEP 2" title="Set up your Company Profile (legal identity)">
        <Ol>
          <li>
            Open <strong>Administration → Company Profile</strong>.
          </li>
          <li>
            Enter your legal details: company name (English & Arabic), CR number, VAT number,
            phone, email, address, and bank details (bank, beneficiary, IBAN, account no.).
          </li>
          <li>
            <strong>Why this matters:</strong> every printed document — waybills, quotations, and
            tax invoices — automatically carries this information as its letterhead. Update it
            once here and all documents change.
          </li>
        </Ol>
      </Section>

      <Section icon={Truck} step="STEP 3" title="Register your fleet & drivers">
        <Ol>
          <li>
            <strong>Resources → Fleet → New Vehicle:</strong> plate number, type (trailer,
            flatbed, box truck…), capacity, and status (Available / On Trip / Maintenance /
            Offline).
          </li>
          <li>
            <strong>Resources → Drivers → New Driver:</strong> name, phone, licence number — and
            assign the truck the driver normally operates.
          </li>
          <li>
            The driver-truck link powers auto-selection at dispatch time: pick the driver and
            their truck is filled in automatically.
          </li>
        </Ol>
      </Section>

      <Section icon={Users} step="STEP 4" title="Register customers with their legal documents">
        <Ol>
          <li>
            <strong>Commercial → Customers → New Customer.</strong>
          </li>
          <li>
            Enter the customer name in <strong>English and Arabic separately</strong>, the
            company, the <strong>contact person</strong>, phone, and email (optional).
          </li>
          <li>
            Record their <strong>CR number and VAT number</strong>, and attach scanned copies of
            the CR and VAT certificates (PDF or image).
          </li>
          <li>
            Set the <strong>agreed payment terms</strong>: <em>Cash</em> (invoice due the same day
            the originals + invoice reach them) or <em>Credit</em> with the agreed number of days.
            The invoicing system uses this automatically later.
          </li>
        </Ol>
      </Section>

      <Section icon={FileSignature} step="STEP 5" title="Send a quotation (when a customer asks for a price)">
        <Ol>
          <li>
            <strong>Commercial → Quotations → New Quotation.</strong>
          </li>
          <li>
            Choose the customer, the route (loading → destination), and the trip type:{" "}
            <strong>one-way</strong> or <strong>round trip</strong> (deliver, unload, and return
            empty).
          </li>
          <li>Enter equipment type, cargo description, price, VAT %, and validity days.</li>
          <li>
            Click <strong>Print</strong> — a professional quotation opens with your letterhead,
            price table, VAT breakdown, terms, bank details, and signature blocks. Use{" "}
            <strong>Print / Save as PDF</strong> to send it to the customer.
          </li>
          <li>Track its status: Draft → Sent → Accepted / Rejected.</li>
        </Ol>
      </Section>

      <Section icon={Package} step="STEP 6" title="Create a booking (shipment)">
        <Ol>
          <li>
            <strong>Operations → Shipments (Bookings) → New Shipment.</strong>
          </li>
          <li>Select the customer, priority (Standard / Express / Overnight), and weight.</li>
          <li>
            Type the <strong>origin and destination</strong> — the box suggests all major Saudi
            cities and your facilities as you type.
          </li>
          <li>
            Set the exact locations on the map: click the map to <strong>drop a pin</strong> for
            origin (green) and destination (red), or <strong>paste a Google Maps link</strong> or
            raw coordinates (e.g. <Code>24.7136, 46.6753</Code>) into the address box. Wrong pin?
            Use <strong>Clear all pins</strong> and start over.
          </li>
          <li>
            You can <strong>edit or amend the booking freely until a driver is dispatched</strong>
            . After dispatch it locks completely — it can only be cancelled, with a written
            reason.
          </li>
          <li>
            Print the <strong>Waybill (OBL)</strong> from the booking page at any time — it is
            your road transport bill of lading with all customer, company, and shipment details.
          </li>
        </Ol>
      </Section>

      <Section icon={Send} step="STEP 7" title="Dispatch a driver & truck">
        <Ol>
          <li>
            Open the booking (or <strong>Operations → Dispatching</strong> for the queue of
            pending bookings).
          </li>
          <li>
            Pick a driver — their registered truck is <strong>selected automatically</strong>.
            Override it if needed.
          </li>
          <li>
            Driver or truck not in the system? Tick <strong>Manual selection</strong> and type the
            driver&apos;s name, phone (it prints on the waybill), and truck model/plate.
          </li>
          <li>
            Enter the <strong>Driver Allowance / Trip Money</strong> (optional). Note: it stays{" "}
            <strong>locked for payment</strong> until the driver returns the signed originals
            after delivery (Step 9).
          </li>
          <li>
            Click <strong>Dispatch Shipment</strong> — a trip is created, the logistics cycle
            starts, and the booking locks against editing.
          </li>
        </Ol>
      </Section>

      <Section icon={MapPin} step="STEP 8" title="Run the trip & track it live">
        <Ol>
          <li>
            On the trip page, advance the status as the journey progresses:{" "}
            <strong>Collecting → In Transit → At Delivery → Delivered</strong>. Each step is
            time-stamped on the 6-stage logistics cycle.
          </li>
          <li>
            Problems on the road? <strong>Mark Delayed</strong> (with a note) or report an
            incident under <strong>Delivery & Proof → Incidents</strong>.
          </li>
          <li>
            Watch every active truck on <strong>Operations → Live Map Tracking</strong>; the
            dashboard shows the current trip with progress and ETA.
          </li>
          <li>
            Cancelling a trip requires a <strong>written reason</strong>, which is stored on the
            booking.
          </li>
        </Ol>
      </Section>

      <Section icon={BadgeCheck} step="STEP 9" title="Deliver & capture proof">
        <Ol>
          <li>
            When the truck arrives, mark <strong>At Delivery</strong>, then{" "}
            <strong>Delivered</strong> after unloading.
          </li>
          <li>
            Upload the signed POD under <strong>Delivery & Proof → POD & Proof</strong> (photo or
            scan, receiver name, notes).
          </li>
          <li>
            Attach any other paperwork under <strong>Documents</strong> (linked to the shipment or
            trip).
          </li>
          <li>
            Marking Delivered automatically frees the driver & truck and{" "}
            <strong>opens the Payment Follow-up file</strong> for the accounts cycle.
          </li>
        </Ol>
      </Section>

      <Section icon={BadgeDollarSign} step="STEP 10" title="Payment follow-up — originals, invoice & collection">
        <p>
          <strong>Finance → Payment Follow-up</strong> is the accounts department&apos;s screen. Every
          delivered shipment moves through 5 tracked stages:
        </p>
        <Ol>
          <li>
            <strong>Delivered</strong> — the signed originals are still with the driver.
          </li>
          <li>
            <strong>Originals in Yard</strong> — the driver hands the originals to the yard
            supervisor / dispatcher, who clicks <em>Confirm Originals Received</em>. Only now is
            the driver&apos;s <strong>trip money released</strong> for payment.
          </li>
          <li>
            <strong>With Accounts</strong> — the yard hands the documents to accounts (one click).
          </li>
          <li>
            <strong>Invoiced</strong> — accounts enters the freight amount and clicks{" "}
            <em>Issue Invoice & Print</em>. A numbered <strong>Tax Invoice</strong> opens, ready
            to send with the originals. The due date is set automatically:{" "}
            <em>Cash</em> = same day; <em>Credit</em> = the customer&apos;s agreed days. Overdue
            invoices are flagged red in the list.
          </li>
          <li>
            <strong>Paid & Closed</strong> — when the customer pays, click{" "}
            <em>Payment Received — Close as Paid</em>. The shipment file is closed.
          </li>
        </Ol>
        <p>
          Mis-clicked a step? Use <strong>Undo Step</strong> to go one stage back.
        </p>
      </Section>

      <Section icon={BarChart3} step="STEP 11" title="Daily tools">
        <Ol>
          <li>
            <strong>Global search</strong> (top bar, Ctrl+K style) finds any shipment, trip,
            driver, customer, or plate number instantly.
          </li>
          <li>
            <strong>Notifications bell</strong> shows delays, pending PODs, and alerts.
          </li>
          <li>
            <strong>Administration → Reports & Analytics</strong>: shipment volumes, on-time
            performance, fleet utilisation, and driver stats.
          </li>
          <li>
            <strong>Export</strong> buttons download filtered lists as CSV (opens in Excel).
          </li>
          <li>
            The <strong>← back button</strong> in the top bar always goes one level up (details →
            list), and the breadcrumb trail is clickable.
          </li>
        </Ol>
      </Section>

      <Section icon={Printer} step="PRINTING" title="Printing any document">
        <Ol>
          <li>
            Open the document (Waybill from a booking, Quotation, or Tax Invoice from Payment
            Follow-up) and click <strong>Print / Save as PDF</strong>.
          </li>
          <li>
            In the browser dialog choose your printer, or choose <em>Save as PDF</em> to email it.
          </li>
          <li>
            All documents are A4 with your company letterhead, CR/VAT numbers, bank details, and
            signature areas.
          </li>
        </Ol>
      </Section>
    </div>
  );
}

export function DeployGuide() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        <p className="font-semibold">What this app is (and where it lives)</p>
        <p className="mt-1">
          This TMS was built with Claude Code. It is a <strong>Next.js</strong> web application
          with a local <strong>SQLite database</strong> — the entire system is one folder on this
          computer: <Code>C:\Users\free\easy-logic-tms</Code>. The database (all your bookings,
          customers, invoices) is a single file inside it: <Code>prisma\dev.db</Code>. Copy the
          folder = copy the whole system.
        </p>
      </div>

      <Section icon={Monitor} step="OPTION A" title="Run it on this (or any) Windows PC">
        <p className="font-medium text-slate-700">One-time setup on a new PC:</p>
        <Ol>
          <li>
            Install <strong>Node.js LTS</strong> from{" "}
            <span className="font-medium">nodejs.org</span> (click Next through the installer).
          </li>
          <li>
            Copy the whole <Code>easy-logic-tms</Code> folder to the new PC (USB drive or network
            share). You can skip the huge <Code>node_modules</Code> folder — it is rebuilt by the
            install command.
          </li>
          <li>
            Open <strong>PowerShell</strong>, then run:
            <CodeBlock>{`cd C:\\path\\to\\easy-logic-tms
npm install
npx prisma migrate deploy`}</CodeBlock>
          </li>
        </Ol>
        <p className="mt-3 font-medium text-slate-700">Start the app (every time):</p>
        <CodeBlock>{`cd C:\\path\\to\\easy-logic-tms
npm run build     (first time / after updates)
npm start`}</CodeBlock>
        <p>
          Then open <Code>http://localhost:3000</Code> in your browser. Other computers on the
          same office network can open{" "}
          <Code>http://YOUR-PC-IP:3000</Code> (find your IP with <Code>ipconfig</Code>) — so one
          PC can act as the office server.
        </p>
        <p className="mt-2">
          <strong>Start with a double-click:</strong> create a file called{" "}
          <Code>start-tms.bat</Code> on your desktop containing:
        </p>
        <CodeBlock>{`cd /d C:\\path\\to\\easy-logic-tms
npm start`}</CodeBlock>
      </Section>

      <Section icon={Globe} step="OPTION B" title="Put it on a website (your own server / VPS)">
        <p>
          To access the system from anywhere (office, home, phone), host it on a small cloud
          server — e.g. Hetzner, DigitalOcean, AWS Lightsail (~$5–10/month), running Ubuntu:
        </p>
        <Ol>
          <li>
            On the server, install Node.js LTS, then upload the project folder (via{" "}
            <Code>scp</Code>, SFTP, or Git).
          </li>
          <li>
            <CodeBlock>{`cd ~/easy-logic-tms
npm install
npx prisma migrate deploy
npm run build
npm install -g pm2
pm2 start npm --name tms -- start
pm2 save && pm2 startup`}</CodeBlock>
            <Code>pm2</Code> keeps the app running 24/7 and restarts it after reboots.
          </li>
          <li>
            Point your domain (e.g. <Code>tms.alrawasi.sa</Code>) at the server IP, and put{" "}
            <strong>Nginx + a free Let&apos;s Encrypt SSL certificate</strong> in front (
            <Code>certbot --nginx</Code>) so it runs on secure https.
          </li>
          <li>
            <strong>Before going live:</strong> change <Code>SESSION_SECRET</Code> in the{" "}
            <Code>.env</Code> file to a long random string, and change all demo passwords.
          </li>
        </Ol>
      </Section>

      <Section icon={Globe} step="OPTION C" title="Deploy on Vercel (easiest hosting for Next.js)">
        <Ol>
          <li>
            Push the project folder to a private <strong>GitHub</strong> repository.
          </li>
          <li>
            Sign up at <strong>vercel.com</strong>, click <em>Import Project</em>, and select the
            repo — Vercel builds and hosts it automatically with a free https URL.
          </li>
          <li>
            <strong>Important:</strong> Vercel&apos;s servers don&apos;t keep local files, so the SQLite
            database must be swapped for a hosted database (free tiers exist — e.g. Neon or Turso).
            In <Code>prisma/schema.prisma</Code> change{" "}
            <Code>provider = &quot;sqlite&quot;</Code> to{" "}
            <Code>provider = &quot;postgresql&quot;</Code>, set <Code>DATABASE_URL</Code> in
            Vercel&apos;s environment settings to the database&apos;s connection string, and run{" "}
            <Code>npx prisma migrate deploy</Code>. Ask Claude Code to do this migration for you —
            it is a 10-minute change.
          </li>
        </Ol>
      </Section>

      <Section icon={Database} step="BACKUPS" title="Backing up your data">
        <Ol>
          <li>
            All data lives in one file: <Code>prisma\dev.db</Code>. Copy it somewhere safe
            (external drive / cloud storage) — daily is recommended.
          </li>
          <li>
            To restore: stop the app, replace <Code>dev.db</Code> with your backup copy, start the
            app.
          </li>
          <li>
            Customer CR/VAT attachments and PODs are stored inside the same database file, so one
            backup covers everything.
          </li>
        </Ol>
      </Section>

      <Section icon={ShieldCheck} step="UPDATES" title="Changing or extending the app">
        <p>
          The full source code is yours, in the project folder. To add features, fix issues, or
          rebrand, open the folder with <strong>Claude Code</strong> and describe what you want in
          plain language — the same way this whole system was built. Useful commands while
          developing:
        </p>
        <CodeBlock>{`npm run dev        # run in development mode (auto-reloads)
npm run db:seed    # reset demo data (wipes real data!)
npm run db:studio  # visual database browser`}</CodeBlock>
      </Section>
    </div>
  );
}

// ── Reusable pieces for the Team & Subscription chapter ──────────────────────

function RoleCard({
  icon: Icon,
  code,
  color,
  title,
  reports,
  duties,
  tools,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  code: string;
  color: string;
  title: string;
  reports: string;
  duties: string[];
  tools: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <Icon size={20} />
        </span>
        <div>
          <p className="font-semibold text-slate-900">
            <span
              className="me-2 rounded px-1.5 py-0.5 text-[11px] font-extrabold text-white"
              style={{ backgroundColor: color }}
            >
              {code}
            </span>
            {title}
          </p>
          <p className="text-xs text-slate-400">{reports}</p>
        </div>
      </div>
      <p className="mt-3 mb-1 text-[10px] font-semibold tracking-widest text-slate-400">
        RESPONSIBILITIES
      </p>
      <ul className="space-y-1 text-sm text-slate-600">
        {duties.map((d, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className="flex-1">{d}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500">
        <strong className="text-slate-600">Works mainly in:</strong> {tools}
      </p>
    </div>
  );
}

function PlanCard({
  icon: Icon,
  name,
  price,
  unit,
  best,
  featured,
  features,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  name: string;
  price: string;
  unit: string;
  best: string;
  featured?: boolean;
  features: string[];
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        featured
          ? "border-brand-400 bg-brand-50/40 ring-2 ring-brand-100"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="mb-1 flex items-center gap-2">
        <Icon size={18} className={featured ? "text-brand-600" : "text-slate-500"} />
        <h4 className="text-base font-bold text-slate-900">{name}</h4>
        {featured && (
          <span className="ms-auto rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
            MOST POPULAR
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold text-slate-900">
        {price}
        <span className="text-sm font-medium text-slate-400"> {unit}</span>
      </p>
      <p className="mb-3 text-xs text-slate-500">{best}</p>
      <ul className="space-y-1.5 text-sm text-slate-600">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TeamGuide() {
  return (
    <div className="space-y-4">
      {/* Intro */}
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 text-sm text-brand-900">
        <p className="text-base font-semibold">
          Introduction — who runs Easy Logic, and how many people you need.
        </p>
        <p className="mt-1">
          Easy Logic is built so a <strong>small transport office can run a full fleet</strong> with
          a handful of people, and scale up cleanly as you grow. This chapter explains the roles,
          the minimum team, exactly who does what at each step, and the subscription plans.
        </p>
      </div>

      {/* Capacity */}
      <Section icon={BarChart3} step="CAPACITY" title="What one Easy Logic account can handle">
        <p>
          There is no hard limit on records — the system comfortably handles{" "}
          <strong>thousands of shipments, hundreds of trucks and drivers, and unlimited
          customers</strong> on a single account. In day-to-day practice:
        </p>
        <Ol>
          <li>
            <strong>One dispatcher</strong> can comfortably manage{" "}
            <strong>15–30 active trucks</strong> per shift.
          </li>
          <li>
            <strong>One customer-service agent</strong> can follow up{" "}
            <strong>40–60 live shipments</strong> at a time.
          </li>
          <li>
            <strong>One accountant</strong> can process the invoicing and trip-money for a fleet of{" "}
            <strong>up to ~50 trucks</strong>.
          </li>
          <li>
            The number of user logins you create is governed by your{" "}
            <strong>subscription plan</strong> (see the Plans section below), not by the software.
          </li>
        </Ol>
      </Section>

      {/* Minimum team */}
      <Section icon={Users} step="MINIMUM TEAM" title="The smallest team that operates it properly">
        <p>
          The operation is designed around <strong>four roles</strong>. They can be four different
          people, or — for a small yard — a few people wearing more than one hat.
        </p>
        <div className="my-3 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2">Fleet size</th>
                <th className="px-3 py-2">Minimum people</th>
                <th className="px-3 py-2">How they split the roles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-3 py-2 font-medium text-slate-700">1–5 trucks</td>
                <td className="px-3 py-2 font-bold text-brand-600">2 people</td>
                <td className="px-3 py-2 text-slate-600">
                  Person A = CS + Dispatcher; Person B = Accounts (often the owner). Drivers use the
                  phone app.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-700">5–20 trucks</td>
                <td className="px-3 py-2 font-bold text-brand-600">3 people</td>
                <td className="px-3 py-2 text-slate-600">
                  1 CS, 1 Yard Dispatcher, 1 Accountant. Recommended baseline for a healthy
                  operation.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-700">20–50 trucks</td>
                <td className="px-3 py-2 font-bold text-brand-600">4–6 people</td>
                <td className="px-3 py-2 text-slate-600">
                  1–2 CS, 1–2 Dispatchers, 1 Accountant, 1 Operations Manager (oversees & reports).
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-700">50+ trucks</td>
                <td className="px-3 py-2 font-bold text-brand-600">6+ people</td>
                <td className="px-3 py-2 text-slate-600">
                  Multiple CS & dispatchers on shifts, an accounts team, and a manager on the
                  Reports & Activity Log.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <strong>Absolute minimum:</strong> the app can be run by <strong>1 person</strong> (the
          owner doing everything) — but for the money-safety rules to actually protect you, the{" "}
          <strong>dispatcher and the accountant should be two different people</strong>. That
          separation is what stops trip money going out before the original documents are back.
        </p>
      </Section>

      {/* Role cards */}
      <div className="card p-5">
        <p className="mb-1 text-xs font-semibold tracking-widest text-slate-400">
          THE FOUR ROLES — WHO DOES WHAT
        </p>
        <p className="mb-4 text-sm text-slate-500">
          A full visual step-by-step flow of these roles also lives in{" "}
          <strong>Overview → Operations Guide</strong>.
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RoleCard
            icon={Headset}
            code="CS"
            color="#ea580c"
            title="Customer Service Representative"
            reports="Front office — talks to customers"
            duties={[
              "Receives the customer's order and creates the booking (Shipments → New).",
              "Chooses the agreed lane/rate for that customer.",
              "Follows the driver and updates status at every stage: loading, in transit, arrival, delivered, and empty-return for round trips.",
              "Keeps the customer informed until delivery.",
            ]}
            tools="Quotations, Shipments, Trips (status updates), Live Map"
          />
          <RoleCard
            icon={Warehouse}
            code="DS"
            color="#d97706"
            title="Yard Dispatcher / Supervisor"
            reports="The yard — controls trucks & documents"
            duties={[
              "Assigns an available driver & truck to the booking.",
              "Enters the trip money amount (the waybill will not print without it).",
              "Prints the waybill + trip-money receipt and hands them to the driver, then marks the trip Dispatched.",
              "Receives the ORIGINAL signed documents back from the driver and confirms it in the system — this releases the trip money.",
            ]}
            tools="Dispatching, Trips, Payment Follow-up (receive originals)"
          />
          <RoleCard
            icon={Calculator}
            code="ACC"
            color="#0d9488"
            title="Accountant"
            reports="Finance — controls the money"
            duties={[
              "Checks the yard confirmed the originals, then transfers the driver's trip money and uploads the payment slip.",
              "Issues the tax invoice (with any extra charges) and attaches the original documents.",
              "Follows up the customer payment per the agreed terms (cash / credit).",
              "Marks the shipment PAID and closed.",
            ]}
            tools="Payment Follow-up, Invoices, Trip money transfer"
          />
          <RoleCard
            icon={UserCog}
            code="MGR"
            color="#0891b2"
            title="Operations Manager / Admin"
            reports="Oversight — the big picture"
            duties={[
              "Adds and manages users & roles, sets up Company Profile and customer rate cards.",
              "Watches performance in Reports & Analytics and the Fleet Maintenance schedule.",
              "Reviews the Activity Log for corrections and money events.",
              "Not needed for very small teams — the owner covers this.",
            ]}
            tools="Users & Roles, Company Profile, Reports, Activity Log, Maintenance"
          />
        </div>
      </div>

      {/* The driver */}
      <Section icon={Truck} step="THE DRIVER" title="What the driver does (mostly on the phone)">
        <Ol>
          <li>Comes to the yard, receives the waybill + trip-money receipt.</li>
          <li>Loads, transports, and delivers the shipment (returns the empty container on round trips).</li>
          <li>Gets the customer&apos;s signature on the original documents.</li>
          <li>Hands the ORIGINAL documents to the yard dispatcher.</li>
          <li>
            Sends a photo of the trip-money receipt to Accounts on WhatsApp{" "}
            <strong>0592888119</strong> — before 4 PM the money is transferred within 4 hours; after
            4 PM, within 24 hours.
          </li>
        </Ol>
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Drivers don&apos;t normally need a login — they carry the printed documents and use
          WhatsApp/phone. If you want drivers to see their own trips on the phone, give them a{" "}
          <strong>Driver</strong> role login and they open the app via &quot;Add to Home
          Screen&quot;.
        </p>
      </Section>

      {/* Separation-of-duties rules */}
      <Section icon={ShieldCheck} step="THE RULES" title="Operating rules that keep the money safe">
        <Ol>
          <li>
            <strong>No waybill without trip money.</strong> The dispatcher must enter the amount
            first — page 2 of the waybill is the driver&apos;s money receipt.
          </li>
          <li>
            <strong>No &quot;Dispatched&quot; until the driver holds the waybill.</strong> The
            status is only advanced once the paperwork is physically handed over.
          </li>
          <li>
            <strong>No trip money until the yard confirms the originals.</strong> The accountant
            literally cannot send the money until &quot;originals received&quot; is ticked.
          </li>
          <li>
            <strong>No invoice without the original documents attached.</strong>
          </li>
          <li>
            <strong>Dispatcher ≠ Accountant.</strong> Keep these two roles with different people so
            no single person controls both the documents and the cash.
          </li>
          <li>
            Every status change, correction, and payment is written to the{" "}
            <strong>Activity Log</strong> forever — nothing is silently deleted.
          </li>
        </Ol>
      </Section>

      {/* Subscription plans */}
      <div className="card p-5">
        <p className="mb-1 text-xs font-semibold tracking-widest text-slate-400">
          SUBSCRIPTION PLANS
        </p>
        <p className="mb-4 text-sm text-slate-500">
          Easy Logic is offered as a monthly software subscription (SaaS). Plans are priced by fleet
          size and the number of user logins. Indicative pricing in Saudi Riyal (SAR); annual
          billing gives ~2 months free.
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <PlanCard
            icon={Star}
            name="Starter"
            price="SAR 299"
            unit="/ month"
            best="For owner-operators & small yards (1–5 trucks)."
            features={[
              "Up to 5 trucks & 3 user logins",
              "Bookings, dispatch, trips, live map",
              "Trip-money control & waybills",
              "Invoicing with VAT",
              "Email support",
            ]}
          />
          <PlanCard
            icon={Crown}
            name="Business"
            price="SAR 749"
            unit="/ month"
            featured
            best="For growing fleets (up to 20 trucks)."
            features={[
              "Up to 20 trucks & 10 user logins",
              "Everything in Starter, plus:",
              "Payment follow-up & settlement cycle",
              "Fleet maintenance (FAW plan) & GPS-ready",
              "Reports, Activity Log (audit trail)",
              "Arabic/English, priority support",
            ]}
          />
          <PlanCard
            icon={Gem}
            name="Enterprise"
            price="Custom"
            unit="pricing"
            best="For large operators (50+ trucks, multi-branch)."
            features={[
              "Unlimited trucks & user logins",
              "Everything in Business, plus:",
              "Live GPS integration & driver app",
              "WhatsApp/SMS customer notifications",
              "Dedicated server & daily backups",
              "Onboarding, training & account manager",
            ]}
          />
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Prices shown are indicative examples for the subscriber&apos;s reference — set your own
          published rates before selling. A 14-day free trial and one-time onboarding/training fee
          are commonly offered.
        </p>
      </div>

      {/* Why it pays off */}
      <Section icon={BadgeDollarSign} step="THE BENEFITS" title="Why the subscription pays for itself">
        <Ol>
          <li>
            <strong>No lost trip money.</strong> The originals-before-cash rule alone prevents
            losses that dwarf the monthly fee.
          </li>
          <li>
            <strong>Faster invoicing & collection.</strong> Invoices go out the same day with the
            documents attached, so you get paid sooner.
          </li>
          <li>
            <strong>Fewer staff needed.</strong> One dispatcher manages 15–30 trucks — the system
            does the tracking, paperwork, and follow-up that used to need extra people.
          </li>
          <li>
            <strong>No missed maintenance.</strong> The FAW service schedule prevents costly
            breakdowns and extends truck life.
          </li>
          <li>
            <strong>Full accountability.</strong> The audit log ends &quot;who did this?&quot;
            disputes and protects you in any disagreement.
          </li>
          <li>
            <strong>Professional image.</strong> Branded bilingual waybills and tax invoices make
            you look like a top-tier carrier to your customers.
          </li>
        </Ol>
      </Section>
    </div>
  );
}
