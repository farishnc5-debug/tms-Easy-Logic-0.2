// ZATCA QR code payload: Tag-Length-Value records, Base64 encoded.
// Tags 1-7 are UTF-8 text (6 and 7 hold the same Base64 strings that appear in
// the signed XML); tags 8 and 9 are raw DER bytes.
export type QrFields = {
  sellerName: string;
  vatNumber: string;
  timestamp: string; // e.g. 2026-09-26T12:13:57
  totalWithVat: string; // "230.00"
  vatTotal: string; // "30.00"
  invoiceHash?: string; // base64 text of the invoice hash, as in the XML (tag 6)
  signature?: string; // base64 text of the ECDSA signature, as in the XML (tag 7)
  publicKey?: Buffer; // SPKI DER public key (tag 8)
  certificateSignature?: Buffer; // ZATCA CA's signature of the stamp cert (tag 9, simplified only)
};

function record(tag: number, value: Buffer): Buffer {
  if (value.length > 255) throw new Error(`QR tag ${tag} is too long (${value.length} bytes)`);
  return Buffer.concat([Buffer.from([tag, value.length]), value]);
}

const text = (s: string) => Buffer.from(s, "utf8");

export function buildQr(f: QrFields): string {
  const parts = [
    record(1, text(f.sellerName)),
    record(2, text(f.vatNumber)),
    record(3, text(f.timestamp)),
    record(4, text(f.totalWithVat)),
    record(5, text(f.vatTotal)),
  ];
  if (f.invoiceHash) parts.push(record(6, text(f.invoiceHash)));
  if (f.signature) parts.push(record(7, text(f.signature)));
  if (f.publicKey) parts.push(record(8, f.publicKey));
  if (f.certificateSignature) parts.push(record(9, f.certificateSignature));
  return Buffer.concat(parts).toString("base64");
}
