/**
 * Adapter for the Wasiqa (وثيقة) road transport document issued through Saudi
 * Arabia's Transport General Authority (TGA).
 *
 * A Wasiqa is issued by the transporter against a specific consignment AND a
 * specific truck + driver pair, and the driver must carry a valid one for the
 * duration of the journey. That has two consequences this module encodes:
 *
 *   1. It expires. An issue date alone is not enough to know it is still valid.
 *   2. Reassigning the truck or driver invalidates it — the document names the
 *      original pair, so a reassigned trip needs a fresh Wasiqa.
 *
 * Credentials live in the `Integration` row of type "TGA" (same pattern as
 * GMAIL / WHATSAPP / TELEGRAM), so no schema change is needed to configure it.
 *
 * STATUS: the validity helpers below are live and used by the UI today. The
 * network methods are a seam only — they intentionally throw until real TGA
 * API credentials and endpoint docs are available, rather than silently
 * pretending to have issued a legal document.
 */

export interface TgaConfig {
  /** Transporter's operator code as registered with TGA. */
  carrierCode: string;
  apiKey: string;
  /** Override for sandbox vs production. */
  baseUrl?: string;
  environment?: "sandbox" | "production";
}

export type WasiqaStatus = "NOT_ISSUED" | "ISSUED" | "EXPIRED" | "CANCELLED";

/** What we know about a shipment's Wasiqa, from our own records. */
export interface WasiqaRecord {
  number: string | null;
  status: string | null;
  issuedAt: Date | null;
  /** Not yet persisted — see wasiqaExpiresAt in the schema TODO. */
  expiresAt?: Date | null;
}

export interface WasiqaValidity {
  state: WasiqaStatus;
  /** Safe to hand to a driver and dispatch. */
  valid: boolean;
  /** Whole days until expiry; null when unknown or not issued. */
  daysRemaining: number | null;
  /** Human-readable reason when not valid — surfaced in the UI. */
  reason?: string;
}

/**
 * Default validity window for a Wasiqa when no explicit expiry is recorded.
 * Conservative on purpose: better to re-check a still-valid document than to
 * dispatch a driver on an expired one.
 */
export const DEFAULT_WASIQA_VALID_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Derives the real state of a Wasiqa from what we have recorded.
 * Pure — no DB or network — so it is safe to call from server or client code.
 */
export function getWasiqaValidity(
  record: WasiqaRecord,
  now: Date = new Date(),
): WasiqaValidity {
  const status = (record.status ?? "").toUpperCase();

  if (status === "CANCELLED") {
    return { state: "CANCELLED", valid: false, daysRemaining: null, reason: "Wasiqa was cancelled" };
  }
  if (!record.number || status === "" || status === "NOT_ISSUED") {
    return { state: "NOT_ISSUED", valid: false, daysRemaining: null, reason: "No Wasiqa issued yet" };
  }

  // Fall back to a conservative window from the issue date when no explicit
  // expiry has been recorded.
  const expiry =
    record.expiresAt ??
    (record.issuedAt ? new Date(record.issuedAt.getTime() + DEFAULT_WASIQA_VALID_DAYS * DAY_MS) : null);

  if (!expiry) {
    return { state: "ISSUED", valid: true, daysRemaining: null, reason: "No issue date recorded — expiry unknown" };
  }

  const daysRemaining = Math.floor((expiry.getTime() - now.getTime()) / DAY_MS);

  if (status === "EXPIRED" || daysRemaining < 0) {
    return { state: "EXPIRED", valid: false, daysRemaining, reason: "Wasiqa has expired" };
  }

  return { state: "ISSUED", valid: true, daysRemaining };
}

/**
 * A Wasiqa names a specific truck and driver. If either changed after it was
 * issued, the document no longer matches the trip and must be reissued.
 */
export function isWasiqaStaleAfterReassign(
  wasiqaIssuedAt: Date | null,
  tripReassignedAt: Date | null,
): boolean {
  if (!wasiqaIssuedAt || !tripReassignedAt) return false;
  return tripReassignedAt.getTime() > wasiqaIssuedAt.getTime();
}

export class TgaNotConfiguredError extends Error {
  constructor(message = "TGA integration is not configured") {
    super(message);
    this.name = "TgaNotConfiguredError";
  }
}

export class TgaWasiqaAdapter {
  private config: TgaConfig;

  constructor(config: TgaConfig) {
    this.config = config;
  }

  private assertConfigured() {
    if (!this.config?.apiKey || !this.config?.carrierCode) {
      throw new TgaNotConfiguredError(
        "Set the TGA carrier code and API key under Connections before issuing a Wasiqa.",
      );
    }
    throw new TgaNotConfiguredError(
      "TGA API endpoints are not wired yet. Issue the Wasiqa on the TGA portal and record its number here.",
    );
  }

  /** Issue a new Wasiqa for a shipment. Not yet wired to TGA. */
  async issue(_input: {
    shipmentCode: string;
    plateNumber: string;
    driverIdNumber: string;
    originCity: string;
    destinationCity: string;
    cargoDescription?: string;
    weightKg?: number;
  }): Promise<never> {
    this.assertConfigured();
    throw new TgaNotConfiguredError();
  }

  /** Verify a Wasiqa number against TGA. Not yet wired. */
  async verify(_wasiqaNumber: string): Promise<never> {
    this.assertConfigured();
    throw new TgaNotConfiguredError();
  }

  /** Cancel a previously issued Wasiqa. Not yet wired. */
  async cancel(_wasiqaNumber: string, _reason: string): Promise<never> {
    this.assertConfigured();
    throw new TgaNotConfiguredError();
  }
}
