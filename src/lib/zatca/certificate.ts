import { readNode, children, content, whole, decodeOid, type Node } from "./der";

const RDN_NAMES: Record<string, string> = {
  "2.5.4.3": "CN",
  "2.5.4.6": "C",
  "2.5.4.7": "L",
  "2.5.4.8": "ST",
  "2.5.4.10": "O",
  "2.5.4.11": "OU",
  "0.9.2342.19200300.100.1.25": "DC",
};

export type ParsedCertificate = {
  der: Buffer;
  issuerName: string; // RFC 2253 order (most specific first)
  serialDecimal: string;
  signature: Buffer; // the CA's signature over the certificate (QR tag 9)
  publicKeyDer: Buffer; // SubjectPublicKeyInfo (QR tag 8)
};

function name(n: Node): string {
  const rdns = children(n).map((set) => {
    const atv = children(children(set)[0]);
    const key = RDN_NAMES[decodeOid(atv[0])] ?? decodeOid(atv[0]);
    return `${key}=${content(atv[1]).toString("utf8")}`;
  });
  return rdns.reverse().join(", ");
}

export function parseCertificate(der: Buffer): ParsedCertificate {
  const cert = readNode(der, 0);
  const [tbs, , sigBits] = children(cert);
  const f = children(tbs);
  const hasVersion = f[0].tag === 0xa0;
  const o = hasVersion ? 1 : 0;
  const serialBytes = content(f[o]);
  const serialDecimal = BigInt("0x" + serialBytes.toString("hex")).toString();
  const issuer = f[o + 2];
  const spki = f[o + 5];
  return {
    der,
    issuerName: name(issuer),
    serialDecimal,
    signature: content(sigBits).subarray(1), // drop the "unused bits" byte
    publicKeyDer: Buffer.from(whole(spki)),
  };
}

// ZATCA returns the certificate as base64( base64(DER) ) in binarySecurityToken.
export function certificateFromToken(binarySecurityToken: string): { body: string; parsed: ParsedCertificate } {
  const body = Buffer.from(binarySecurityToken, "base64").toString("utf8").replace(/\s+/g, "");
  return { body, parsed: parseCertificate(Buffer.from(body, "base64")) };
}
