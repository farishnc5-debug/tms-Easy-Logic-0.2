# ZATCA e-invoicing (Fatoora) — how it works and how to go live

Easy Logic signs every invoice, sends it to ZATCA and prints the official QR code.

- **Standard tax invoice (B2B)** — for customers with a VAT number. ZATCA must *clear* it
  (validate + stamp) when it is issued. Shown as "Cleared by ZATCA".
- **Simplified tax invoice (B2C)** — for customers without a VAT number. Issued first and
  *reported* to ZATCA. Shown as "Reported to ZATCA".
- **Credit note** — reverses an accepted invoice (button on the invoice page, reason required).

Which type is used is automatic: a customer with a valid VAT number gets a standard invoice.

## What must be filled in first
1. **Company Profile**: VAT number (15 digits, starts and ends with 3), CR number, and the
   National Address (street, 4-digit building number, district, city, 5-digit postal code).
2. **Each VAT-registered customer**: VAT number and National Address (Customers → edit).

If something is missing, the invoice page says exactly what.

## Testing (safe, no legal effect)
1. Connections → **ZATCA E-Invoicing** → environment **Sandbox** → OTP `123345` → Connect.
2. The app runs ZATCA's six mandatory compliance tests automatically and stores the certificates
   (encrypted). Invoices sent now are test documents and are marked "NOT LEGALLY VALID".
   Note: ZATCA's sandbox only clears invoices issued by its own fictitious test company, so the
   sandbox is for checking the connection, not for real invoices.

## Going live (you must do these — they need your ZATCA account)
1. Log in to the **Fatoora portal** (fatoora.zatca.gov.sa) as the taxpayer.
2. Choose to onboard a new e-invoicing solution/device and **generate an OTP** (it expires quickly).
3. In Easy Logic → Connections → ZATCA → environment **Production** → paste the OTP → Connect.
   (You can rehearse first with **Simulation**, which uses the same steps.)
4. Issue an invoice. It is sent automatically; the invoice page shows the result.

## Rules to know
- Do not switch environments casually: each environment has its own invoice counter and hash chain.
- Keep `APP_ENCRYPTION_KEY` unchanged — the ZATCA private key is stored encrypted with it.
- Invoices that fail because ZATCA was unreachable are retried daily by the scheduled job
  (`CRON_SECRET` must be set). Rejected invoices are not retried: fix the data, then press
  "Retry sending to ZATCA".
- Whether and when your company must use Phase 2 depends on ZATCA's integration waves. Check
  with your accountant.
