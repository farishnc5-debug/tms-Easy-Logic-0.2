import { describe, it, expect } from "vitest";
import { DOMParser } from "@xmldom/xmldom";
import crypto from "crypto";
import { buildQr } from "@/lib/zatca/qr";
import { canonicalize } from "@/lib/zatca/c14n";
import { computeTotals, buildInvoiceTemplate, type ZatcaDocInput } from "@/lib/zatca/invoice-xml";
import { invoiceHashOf } from "@/lib/zatca/sign";
import { validateVatNumber, validateParty, validateSellerVat } from "@/lib/zatca/validate";
import { generateKeyPair, buildCsr } from "@/lib/zatca/csr";
import { oid, readNode, children, decodeOid, content } from "@/lib/zatca/der";

function decodeTlv(b64: string) {
  const buf = Buffer.from(b64, "base64");
  const out: Record<number, Buffer> = {};
  for (let i = 0; i < buf.length; ) {
    const tag = buf[i];
    const len = buf[i + 1];
    out[tag] = buf.subarray(i + 2, i + 2 + len);
    i += 2 + len;
  }
  return out;
}

const baseDoc: ZatcaDocInput = {
  invoiceType: "STANDARD",
  docType: "INVOICE",
  number: "INV-1",
  uuid: "11111111-1111-4111-8111-111111111111",
  issueDate: "2026-09-26",
  issueTime: "10:00:00",
  icv: 1,
  previousHash: "PIH",
  supplier: { name: "Seller & Co", vatNumber: "314724412300003", crNumber: "1", street: "S", buildingNumber: "1234", district: "D", city: "Jeddah", postalCode: "21523" },
  buyer: { name: "Buyer", vatNumber: "399999999800003", street: "S", buildingNumber: "5678", district: "D", city: "Riyadh", postalCode: "12211" },
  lines: [
    { name: "Freight", quantity: 1, unitPrice: 3500 },
    { name: "Waiting", quantity: 1, unitPrice: 200 },
  ],
  vatPct: 15,
  supplyDate: "2026-09-26",
};

describe("QR (TLV)", () => {
  it("encodes the five basic fields as UTF-8 records", () => {
    const t = decodeTlv(
      buildQr({ sellerName: "شركة يلا موف", vatNumber: "314724412300003", timestamp: "2026-09-26T10:00:00", totalWithVat: "4255.00", vatTotal: "555.00" }),
    );
    expect(t[1].toString("utf8")).toBe("شركة يلا موف");
    expect(t[2].toString()).toBe("314724412300003");
    expect(t[4].toString()).toBe("4255.00");
    expect(t[5].toString()).toBe("555.00");
    expect(t[6]).toBeUndefined();
  });

  it("adds hash/signature as text and key/stamp as raw bytes", () => {
    const t = decodeTlv(
      buildQr({
        sellerName: "S", vatNumber: "V", timestamp: "T", totalWithVat: "1", vatTotal: "1",
        invoiceHash: "aGFzaA==", signature: "c2ln", publicKey: Buffer.from([1, 2, 3]), certificateSignature: Buffer.from([9, 9]),
      }),
    );
    expect(t[6].toString()).toBe("aGFzaA==");
    expect(t[7].toString()).toBe("c2ln");
    expect([...t[8]]).toEqual([1, 2, 3]);
    expect([...t[9]]).toEqual([9, 9]);
  });

  it("rejects a value that cannot fit in one length byte", () => {
    expect(() => buildQr({ sellerName: "x".repeat(300), vatNumber: "V", timestamp: "T", totalWithVat: "1", vatTotal: "1" })).toThrow();
  });
});

describe("invoice totals", () => {
  it("calculates VAT per line and sums it (how ZATCA re-computes)", () => {
    const t = computeTotals(baseDoc.lines, 15);
    expect(t).toMatchObject({ net: 3700, vat: 555, gross: 4255 });
  });

  it("rounds each line to halalas before summing", () => {
    const t = computeTotals([{ name: "a", quantity: 3, unitPrice: 0.335 }, { name: "b", quantity: 1, unitPrice: 0.335 }], 15);
    expect(t.lineAmounts).toEqual([1.01, 0.34]);
    expect(t.net).toBe(1.35);
  });
});

describe("invoice XML", () => {
  it("marks standard vs simplified and invoice vs credit note correctly", () => {
    expect(buildInvoiceTemplate(baseDoc)).toContain('<cbc:InvoiceTypeCode name="0100000">388<');
    expect(buildInvoiceTemplate({ ...baseDoc, invoiceType: "SIMPLIFIED" })).toContain('name="0200000">388<');
    const credit = buildInvoiceTemplate({ ...baseDoc, docType: "CREDIT", originalInvoiceNumber: "INV-0", reason: "Wrong amount" });
    expect(credit).toContain(">381<");
    expect(credit).toContain("<cbc:ID>INV-0</cbc:ID>");
    expect(credit).toContain("Wrong amount");
  });

  it("escapes special characters in names", () => {
    expect(buildInvoiceTemplate(baseDoc)).toContain("Seller &amp; Co");
  });

  it("produces well-formed XML once placeholders are filled", () => {
    const xml = buildInvoiceTemplate(baseDoc).replace("{{UBL_EXTENSIONS}}", "").replace("{{SIGNATURE_STUB}}", "").replace("{{QR}}", "QR");
    const errors: string[] = [];
    new DOMParser({ onError: (_l: string, m: string) => errors.push(m) } as never).parseFromString(xml, "text/xml");
    expect(errors).toEqual([]);
  });
});

describe("invoice hash", () => {
  const fill = (ext: string, qr: string) =>
    buildInvoiceTemplate(baseDoc)
      .replace("{{UBL_EXTENSIONS}}", ext)
      .replace("{{SIGNATURE_STUB}}", "\n    <cac:Signature>\n        <cbc:ID>x</cbc:ID>\n    </cac:Signature>")
      .replace("{{QR}}", qr);
  const ext = (v: string) => `\n    <ext:UBLExtensions>\n        <ext:UBLExtension><ext:ExtensionURI>${v}</ext:ExtensionURI></ext:UBLExtension>\n    </ext:UBLExtensions>`;

  it("ignores the signature block, cac:Signature and the QR (they are excluded by design)", () => {
    expect(invoiceHashOf(fill(ext("a"), "QR1")).equals(invoiceHashOf(fill(ext("b"), "QR2")))).toBe(true);
  });

  it("changes when any real invoice content changes", () => {
    const a = invoiceHashOf(fill(ext("a"), "Q"));
    const b = invoiceHashOf(fill(ext("a"), "Q").replace("3500.00", "3600.00"));
    expect(a.equals(b)).toBe(false);
  });
});

describe("canonical XML", () => {
  const canon = (xml: string, mode: "inclusive" | "exclusive" = "inclusive") =>
    canonicalize(new DOMParser().parseFromString(xml, "text/xml").documentElement as never, { mode });

  it("sorts attributes, expands empty elements and escapes text", () => {
    expect(canon('<a z="1" b="2"><c/>x &amp; y</a>')).toBe('<a b="2" z="1"><c></c>x &amp; y</a>');
  });

  it("exclusive mode only emits namespaces that are used", () => {
    const xml = '<r xmlns:a="urn:a" xmlns:b="urn:b"><a:x/></r>';
    expect(canon(xml, "inclusive")).toContain('xmlns:b="urn:b"');
    expect(canon(xml, "exclusive")).not.toContain('xmlns:b="urn:b"');
  });
});

describe("validation helpers", () => {
  it("accepts real-format Saudi VAT numbers only", () => {
    expect(validateVatNumber("314724412300003")).toBe(true);
    expect(validateVatNumber("114724412300003")).toBe(false); // must start with 3
    expect(validateVatNumber("31472441230000")).toBe(false); // 14 digits
    expect(validateVatNumber(null)).toBe(false);
    expect(validateSellerVat("")).toHaveLength(1);
  });

  it("lists every missing/invalid address field", () => {
    expect(validateParty("X", { street: "", buildingNumber: "12", district: "", city: "", postalCode: "1" })).toHaveLength(5);
    expect(validateParty("X", { street: "s", buildingNumber: "1234", district: "d", city: "c", postalCode: "12345" })).toEqual([]);
  });
});

describe("certificate signing request", () => {
  it("encodes OIDs correctly", () => {
    expect([...oid("2.5.4.3")]).toEqual([0x06, 0x03, 0x55, 0x04, 0x03]);
    expect([...oid("1.2.840.113549.1.9.14")]).toEqual([0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x09, 0x0e]);
  });

  it("builds a CSR that verifies against its own public key and carries ZATCA's extensions", () => {
    const kp = generateKeyPair();
    const pem = buildCsr(
      { environment: "SANDBOX", vatNumber: "314724412300003", organizationName: "Yalla Muv Company", organizationUnit: "Jeddah", commonName: "TST-x", egsSerial: "1-a|2-b|3-c", registeredAddress: "Jeddah", businessCategory: "Transport" },
      kp.privateKey,
      kp.publicKeyDer,
    );
    const der = Buffer.from(pem.replace(/-----[^-]+-----|\s/g, ""), "base64");
    const [info, alg, sig] = children(readNode(der, 0));
    expect(decodeOid(children(alg)[0])).toBe("1.2.840.10045.4.3.2");
    const valid = crypto.verify("sha256", der.subarray(info.start, info.end), { key: crypto.createPublicKey({ key: kp.publicKeyDer, format: "der", type: "spki" }), dsaEncoding: "der" }, content(sig).subarray(1));
    expect(valid).toBe(true);
    expect(der.toString("latin1")).toContain("TSTZATCA-Code-Signing");
    expect(der.toString("latin1")).toContain("314724412300003");
  });
});
