import crypto from "crypto";
import { DOMParser, type Element as XmlElement, type Node as XmlNode } from "@xmldom/xmldom";
import { canonicalize } from "./c14n";
import { esc } from "./invoice-xml";
import { buildQr } from "./qr";
import { certificateFromToken } from "./certificate";

const sha256 = (data: string | Buffer) => crypto.createHash("sha256").update(data).digest();

export type SignInput = {
  template: string; // from buildInvoiceTemplate()
  privateKeyPem: string;
  binarySecurityToken: string; // the ZATCA-issued certificate (double base64)
  sellerName: string;
  vatNumber: string;
  issueDate: string;
  issueTime: string;
  gross: string; // "230.00"
  vat: string; // "30.00"
  simplified: boolean;
  signingTime?: Date;
};

export type SignedInvoice = {
  xml: string;
  invoiceHash: string; // base64 of the SHA-256 digest (also the next invoice's PIH)
  qr: string;
};

const NS = {
  dsig: "http://www.w3.org/2000/09/xmldsig#",
  xades: "http://uri.etsi.org/01903/v1.3.2#",
};

const SIGNATURE_STUB = `
    <cac:Signature>
        <cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>
        <cbc:SignatureMethod>urn:oasis:names:specification:ubl:dsig:enveloped:xades</cbc:SignatureMethod>
    </cac:Signature>`;

function signedPropertiesXml(certDigest: string, signingTime: string, issuer: string, serial: string) {
  // Exact whitespace matters: this text is hashed as-is.
  return `<xades:SignedProperties xmlns:xades="${NS.xades}" Id="xadesSignedProperties">
                                    <xades:SignedSignatureProperties>
                                        <xades:SigningTime>${signingTime}</xades:SigningTime>
                                        <xades:SigningCertificate>
                                            <xades:Cert>
                                                <xades:CertDigest>
                                                    <ds:DigestMethod xmlns:ds="${NS.dsig}" Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod>
                                                    <ds:DigestValue xmlns:ds="${NS.dsig}">${certDigest}</ds:DigestValue>
                                                </xades:CertDigest>
                                                <xades:IssuerSerial>
                                                    <ds:X509IssuerName xmlns:ds="${NS.dsig}">${esc(issuer)}</ds:X509IssuerName>
                                                    <ds:X509SerialNumber xmlns:ds="${NS.dsig}">${serial}</ds:X509SerialNumber>
                                                </xades:IssuerSerial>
                                            </xades:Cert>
                                        </xades:SigningCertificate>
                                    </xades:SignedSignatureProperties>
                                </xades:SignedProperties>`;
}

function ublExtensions(p: {
  invoiceHash: string;
  signedPropsHash: string;
  signature: string;
  certBody: string;
  signedProps: string;
}) {
  return `
    <ext:UBLExtensions>
        <ext:UBLExtension>
            <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>
            <ext:ExtensionContent>
                <sig:UBLDocumentSignatures xmlns:sig="urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2" xmlns:sac="urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2" xmlns:sbc="urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2">
                    <sac:SignatureInformation>
                        <cbc:ID>urn:oasis:names:specification:ubl:signature:1</cbc:ID>
                        <sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>
                        <ds:Signature xmlns:ds="${NS.dsig}" Id="signature">
                            <ds:SignedInfo>
                                <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2006/12/xml-c14n11"/>
                                <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/>
                                <ds:Reference Id="invoiceSignedData" URI="">
                                    <ds:Transforms>
                                        <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
                                            <ds:XPath>not(//ancestor-or-self::ext:UBLExtensions)</ds:XPath>
                                        </ds:Transform>
                                        <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
                                            <ds:XPath>not(//ancestor-or-self::cac:Signature)</ds:XPath>
                                        </ds:Transform>
                                        <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
                                            <ds:XPath>not(//ancestor-or-self::cac:AdditionalDocumentReference[cbc:ID='QR'])</ds:XPath>
                                        </ds:Transform>
                                        <ds:Transform Algorithm="http://www.w3.org/2006/12/xml-c14n11"/>
                                    </ds:Transforms>
                                    <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                                    <ds:DigestValue>${p.invoiceHash}</ds:DigestValue>
                                </ds:Reference>
                                <ds:Reference Type="http://www.w3.org/2000/09/xmldsig#SignatureProperties" URI="#xadesSignedProperties">
                                    <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                                    <ds:DigestValue>${p.signedPropsHash}</ds:DigestValue>
                                </ds:Reference>
                            </ds:SignedInfo>
                            <ds:SignatureValue>${p.signature}</ds:SignatureValue>
                            <ds:KeyInfo>
                                <ds:X509Data>
                                    <ds:X509Certificate>${p.certBody}</ds:X509Certificate>
                                </ds:X509Data>
                            </ds:KeyInfo>
                            <ds:Object>
                                <xades:QualifyingProperties xmlns:xades="${NS.xades}" Target="signature">
                                    ${p.signedProps}
                                </xades:QualifyingProperties>
                            </ds:Object>
                        </ds:Signature>
                    </sac:SignatureInformation>
                </sig:UBLDocumentSignatures>
            </ext:ExtensionContent>
        </ext:UBLExtension>
    </ext:UBLExtensions>`;
}

const isRemoved = (n: XmlNode) => {
  if (n.nodeType !== 1) return false;
  const e = n as XmlElement;
  if (e.tagName === "ext:UBLExtensions" || e.tagName === "cac:Signature") return true;
  if (e.tagName === "cac:AdditionalDocumentReference") {
    for (let c = e.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 1 && (c as XmlElement).tagName === "cbc:ID" && c.textContent === "QR") return true;
    }
  }
  return false;
};

// SHA-256 (raw) of the invoice with UBLExtensions, cac:Signature and the QR
// reference removed, canonicalised — the value ZATCA calls the invoice hash.
export function invoiceHashOf(xml: string): Buffer {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  return sha256(canonicalize(doc.documentElement as XmlElement, { mode: "inclusive", skip: isRemoved }));
}

export function signInvoice(input: SignInput): SignedInvoice {
  const { body: certBody, parsed } = certificateFromToken(input.binarySecurityToken);
  const signingTime = (input.signingTime ?? new Date()).toISOString().replace(/\.\d{3}Z$/, "Z");

  // ZATCA's digests of the certificate and SignedProperties are Base64( HEX( SHA-256 ) )
  const b64Hex = (b: Buffer) => Buffer.from(b.toString("hex")).toString("base64");
  const certDigest = b64Hex(sha256(certBody));
  const signedProps = signedPropertiesXml(certDigest, signingTime, parsed.issuerName, parsed.serialDecimal);

  // 1) invoice hash — computed on the document with placeholders in the parts that get removed
  const dummy = ublExtensions({ invoiceHash: "x", signedPropsHash: "x", signature: "x", certBody: "x", signedProps });
  const placeholderXml = input.template
    .replace("{{UBL_EXTENSIONS}}", dummy)
    .replace("{{SIGNATURE_STUB}}", SIGNATURE_STUB)
    .replace("{{QR}}", "QR");
  const hashRaw = invoiceHashOf(placeholderXml);
  const invoiceHash = hashRaw.toString("base64");

  // 2) signature over the invoice hash (ECDSA / SHA-256, DER encoded)
  const key = crypto.createPrivateKey(input.privateKeyPem);
  const signatureBytes = crypto.sign("sha256", hashRaw, { key, dsaEncoding: "der" });

  // 3) digest of the canonical SignedProperties
  const propsDoc = new DOMParser().parseFromString(placeholderXml, "text/xml");
  const propsEl = propsDoc.getElementsByTagName("xades:SignedProperties")[0] as XmlElement;
  const signedPropsHash = b64Hex(sha256(canonicalize(propsEl, { mode: "exclusive" })));

  // 4) QR
  const qr = buildQr({
    sellerName: input.sellerName,
    vatNumber: input.vatNumber,
    timestamp: `${input.issueDate}T${input.issueTime}`,
    totalWithVat: input.gross,
    vatTotal: input.vat,
    invoiceHash,
    signature: signatureBytes.toString("base64"),
    publicKey: parsed.publicKeyDer,
    certificateSignature: input.simplified ? parsed.signature : undefined,
  });

  const xml = input.template
    .replace(
      "{{UBL_EXTENSIONS}}",
      ublExtensions({
        invoiceHash,
        signedPropsHash,
        signature: signatureBytes.toString("base64"),
        certBody,
        signedProps,
      }),
    )
    .replace("{{SIGNATURE_STUB}}", SIGNATURE_STUB)
    .replace("{{QR}}", qr);

  return { xml, invoiceHash, qr };
}
