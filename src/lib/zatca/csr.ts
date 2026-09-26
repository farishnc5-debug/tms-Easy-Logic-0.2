import crypto from "crypto";
import { seq, set, oid, utf8String, printableString, octetString, bitString, integer, contextExplicit } from "./der";

export type ZatcaEnvironment = "SANDBOX" | "SIMULATION" | "PRODUCTION";

// Certificate template names ZATCA's CA recognises per environment
const TEMPLATE: Record<ZatcaEnvironment, string> = {
  SANDBOX: "TSTZATCA-Code-Signing",
  SIMULATION: "PREZATCA-Code-Signing",
  PRODUCTION: "ZATCA-Code-Signing",
};

export type CsrInput = {
  environment: ZatcaEnvironment;
  vatNumber: string; // 15 digits
  organizationName: string; // legal name
  organizationUnit: string; // branch name, or first 10 digits of VAT for a group
  commonName: string; // unique device name, e.g. TST-<solution>-<vat>
  egsSerial: string; // "1-<solution>|2-<model>|3-<uuid>"
  registeredAddress: string;
  businessCategory: string; // industry, e.g. "Transportation"
  invoiceTypes?: string; // "1100" = standard + simplified
};

const rdn = (oidStr: string, value: Buffer) => set(seq(oid(oidStr), value));

export function generateKeyPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", { namedCurve: "secp256k1" });
  return {
    privateKeyPem: privateKey.export({ type: "sec1", format: "pem" }).toString(),
    publicKeyDer: publicKey.export({ type: "spki", format: "der" }) as Buffer,
    privateKey,
  };
}

// Builds the PEM-encoded CSR ZATCA's compliance API expects.
export function buildCsr(input: CsrInput, privateKey: crypto.KeyObject, publicKeyDer: Buffer): string {
  const subject = seq(
    rdn("2.5.4.6", printableString("SA")), // C
    rdn("2.5.4.11", utf8String(input.organizationUnit)), // OU
    rdn("2.5.4.10", utf8String(input.organizationName)), // O
    rdn("2.5.4.3", utf8String(input.commonName)), // CN
  );

  const altName = seq(
    contextExplicit(
      4, // directoryName
      seq(
        rdn("2.5.4.4", utf8String(input.egsSerial)), // SN
        rdn("0.9.2342.19200300.100.1.1", utf8String(input.vatNumber)), // UID
        rdn("2.5.4.12", utf8String(input.invoiceTypes ?? "1100")), // title
        rdn("2.5.4.26", utf8String(input.registeredAddress)), // registeredAddress
        rdn("2.5.4.15", utf8String(input.businessCategory)), // businessCategory
      ),
    ),
  );

  const extensions = seq(
    seq(oid("1.3.6.1.4.1.311.20.2"), octetString(printableString(TEMPLATE[input.environment]))),
    seq(oid("2.5.29.17"), octetString(altName)),
  );

  const attributes = contextExplicit(
    0,
    seq(oid("1.2.840.113549.1.9.14"), set(extensions)), // extensionRequest
  );

  const info = seq(integer(0), subject, publicKeyDer, attributes);
  const signature = crypto.sign("sha256", info, { key: privateKey, dsaEncoding: "der" });
  const csr = seq(info, seq(oid("1.2.840.10045.4.3.2")), bitString(signature)); // ecdsa-with-SHA256

  const b64 = csr.toString("base64").match(/.{1,64}/g)!.join("\n");
  return `-----BEGIN CERTIFICATE REQUEST-----\n${b64}\n-----END CERTIFICATE REQUEST-----\n`;
}
