// Builds a ZATCA UBL 2.1 invoice (standard B2B or simplified B2C, invoice /
// credit note / debit note). Output is a TEMPLATE containing placeholders for
// the parts filled in by signing: {{UBL_EXTENSIONS}}, {{QR}}. The layout and
// whitespace are fixed on purpose — the invoice hash depends on them.
export type ZatcaParty = {
  name: string;
  vatNumber?: string;
  crNumber?: string;
  street: string;
  buildingNumber: string; // 4 digits
  district: string;
  city: string;
  postalCode: string; // 5 digits
};

export type ZatcaLine = {
  name: string;
  quantity: number;
  unitPrice: number; // net of VAT
};

export type ZatcaDocInput = {
  invoiceType: "STANDARD" | "SIMPLIFIED";
  docType: "INVOICE" | "CREDIT" | "DEBIT";
  number: string; // invoice number (BT-1)
  uuid: string;
  issueDate: string; // YYYY-MM-DD
  issueTime: string; // HH:mm:ss
  icv: number; // invoice counter value
  previousHash: string; // base64 hash of the previous invoice (PIH)
  supplier: ZatcaParty;
  buyer?: ZatcaParty;
  lines: ZatcaLine[];
  vatPct: number;
  supplyDate: string; // YYYY-MM-DD
  paymentMeansCode?: string; // 10 cash, 30 credit, 42 bank transfer...
  // credit/debit notes must reference the original invoice and give a reason
  originalInvoiceNumber?: string;
  reason?: string;
};

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const money = (n: number) => (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2);

export type Totals = {
  lineAmounts: number[];
  lineVats: number[];
  net: number;
  vat: number;
  gross: number;
};

// VAT is calculated per line and summed, rounded to halalas at each step —
// this is how ZATCA re-computes it, so totals must agree exactly.
export function computeTotals(lines: ZatcaLine[], vatPct: number): Totals {
  const r = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const lineAmounts = lines.map((l) => r(l.quantity * l.unitPrice));
  const lineVats = lineAmounts.map((a) => r((a * vatPct) / 100));
  const net = r(lineAmounts.reduce((s, a) => s + a, 0));
  const vat = r(lineVats.reduce((s, a) => s + a, 0));
  return { lineAmounts, lineVats, net, vat, gross: r(net + vat) };
}

const typeCode = { INVOICE: "388", CREDIT: "381", DEBIT: "383" } as const;

function party(tag: "AccountingSupplierParty" | "AccountingCustomerParty", p: ZatcaParty | undefined): string {
  if (!p) {
    return `    <cac:${tag}>
        <cac:Party>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName></cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:${tag}>`;
  }
  return `    <cac:${tag}>
        <cac:Party>${
          p.crNumber
            ? `
            <cac:PartyIdentification>
                <cbc:ID schemeID="CRN">${esc(p.crNumber)}</cbc:ID>
            </cac:PartyIdentification>`
            : ""
        }
            <cac:PostalAddress>
                <cbc:StreetName>${esc(p.street)}</cbc:StreetName>
                <cbc:BuildingNumber>${esc(p.buildingNumber)}</cbc:BuildingNumber>
                <cbc:CitySubdivisionName>${esc(p.district)}</cbc:CitySubdivisionName>
                <cbc:CityName>${esc(p.city)}</cbc:CityName>
                <cbc:PostalZone>${esc(p.postalCode)}</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>SA</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>${
              p.vatNumber
                ? `
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${esc(p.vatNumber)}</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>`
                : ""
            }
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${esc(p.name)}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:${tag}>`;
}

export function buildInvoiceTemplate(d: ZatcaDocInput): string {
  const t = computeTotals(d.lines, d.vatPct);
  const cur = "SAR";
  const pct = d.vatPct.toFixed(2);
  const isNote = d.docType !== "INVOICE";
  const typeName = d.invoiceType === "STANDARD" ? "0100000" : "0200000";

  const lines = d.lines
    .map(
      (l, i) => `    <cac:InvoiceLine>
        <cbc:ID>${i + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="PCE">${l.quantity.toFixed(6)}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="${cur}">${money(t.lineAmounts[i])}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="${cur}">${money(t.lineVats[i])}</cbc:TaxAmount>
            <cbc:RoundingAmount currencyID="${cur}">${money(t.lineAmounts[i] + t.lineVats[i])}</cbc:RoundingAmount>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>${esc(l.name)}</cbc:Name>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>${pct}</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="${cur}">${l.unitPrice.toFixed(2)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>`,
    )
    .join("\n");

  const billingRef =
    isNote && d.originalInvoiceNumber
      ? `
    <cac:BillingReference>
        <cac:InvoiceDocumentReference>
            <cbc:ID>${esc(d.originalInvoiceNumber)}</cbc:ID>
        </cac:InvoiceDocumentReference>
    </cac:BillingReference>`
      : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">{{UBL_EXTENSIONS}}
    <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
    <cbc:ID>${esc(d.number)}</cbc:ID>
    <cbc:UUID>${esc(d.uuid)}</cbc:UUID>
    <cbc:IssueDate>${d.issueDate}</cbc:IssueDate>
    <cbc:IssueTime>${d.issueTime}</cbc:IssueTime>
    <cbc:InvoiceTypeCode name="${typeName}">${typeCode[d.docType]}</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>${cur}</cbc:DocumentCurrencyCode>
    <cbc:TaxCurrencyCode>${cur}</cbc:TaxCurrencyCode>${billingRef}
    <cac:AdditionalDocumentReference>
        <cbc:ID>ICV</cbc:ID>
        <cbc:UUID>${d.icv}</cbc:UUID>
    </cac:AdditionalDocumentReference>
    <cac:AdditionalDocumentReference>
        <cbc:ID>PIH</cbc:ID>
        <cac:Attachment>
            <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${d.previousHash}</cbc:EmbeddedDocumentBinaryObject>
        </cac:Attachment>
    </cac:AdditionalDocumentReference>
    <cac:AdditionalDocumentReference>
        <cbc:ID>QR</cbc:ID>
        <cac:Attachment>
            <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">{{QR}}</cbc:EmbeddedDocumentBinaryObject>
        </cac:Attachment>
    </cac:AdditionalDocumentReference>{{SIGNATURE_STUB}}
${party("AccountingSupplierParty", d.supplier)}
${party("AccountingCustomerParty", d.buyer)}
    <cac:Delivery>
        <cbc:ActualDeliveryDate>${d.supplyDate}</cbc:ActualDeliveryDate>
        <cbc:LatestDeliveryDate>${d.supplyDate}</cbc:LatestDeliveryDate>
    </cac:Delivery>
    <cac:PaymentMeans>
        <cbc:PaymentMeansCode>${d.paymentMeansCode ?? "30"}</cbc:PaymentMeansCode>${
          isNote && d.reason
            ? `
        <cbc:InstructionNote>${esc(d.reason)}</cbc:InstructionNote>`
            : ""
        }
    </cac:PaymentMeans>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${cur}">${money(t.vat)}</cbc:TaxAmount>
    </cac:TaxTotal>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${cur}">${money(t.vat)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="${cur}">${money(t.net)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="${cur}">${money(t.vat)}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>${pct}</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="${cur}">${money(t.net)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="${cur}">${money(t.net)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="${cur}">${money(t.gross)}</cbc:TaxInclusiveAmount>
        <cbc:AllowanceTotalAmount currencyID="${cur}">0.00</cbc:AllowanceTotalAmount>
        <cbc:PrepaidAmount currencyID="${cur}">0.00</cbc:PrepaidAmount>
        <cbc:PayableAmount currencyID="${cur}">${money(t.gross)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
${lines}
</Invoice>`;
}
