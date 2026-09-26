// Minimal ASN.1 DER encoder/reader — just enough to build ZATCA's certificate
// signing request (CSR) and to read fields out of the certificate ZATCA issues.
// Node's crypto has no CSR support, and ZATCA's CSR needs custom extensions.

function encodeLength(len: number): Buffer {
  if (len < 0x80) return Buffer.from([len]);
  const bytes: number[] = [];
  let n = len;
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n >>= 8;
  }
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}

export function tlv(tag: number, content: Buffer): Buffer {
  return Buffer.concat([Buffer.from([tag]), encodeLength(content.length), content]);
}

export const seq = (...items: Buffer[]) => tlv(0x30, Buffer.concat(items));
export const set = (...items: Buffer[]) => tlv(0x31, Buffer.concat(items));
export const octetString = (b: Buffer) => tlv(0x04, b);
export const utf8String = (s: string) => tlv(0x0c, Buffer.from(s, "utf8"));
export const printableString = (s: string) => tlv(0x13, Buffer.from(s, "ascii"));
export const ia5String = (s: string) => tlv(0x16, Buffer.from(s, "ascii"));
export const integer = (n: number) => tlv(0x02, Buffer.from([n]));
export const bitString = (b: Buffer) => tlv(0x03, Buffer.concat([Buffer.from([0]), b]));
export const contextExplicit = (n: number, content: Buffer) => tlv(0xa0 | n, content);
export const contextImplicit = (n: number, content: Buffer) => tlv(0xa0 | n, content);

export function oid(dotted: string): Buffer {
  const parts = dotted.split(".").map(Number);
  const bytes: number[] = [parts[0] * 40 + parts[1]];
  for (const p of parts.slice(2)) {
    const chunk: number[] = [p & 0x7f];
    let n = p >> 7;
    while (n > 0) {
      chunk.unshift((n & 0x7f) | 0x80);
      n >>= 7;
    }
    bytes.push(...chunk);
  }
  return tlv(0x06, Buffer.from(bytes));
}

// ---------- reader ----------
export type Node = { tag: number; start: number; contentStart: number; end: number; buf: Buffer };

export function readNode(buf: Buffer, offset = 0): Node {
  const tag = buf[offset];
  let len = buf[offset + 1];
  let contentStart = offset + 2;
  if (len & 0x80) {
    const n = len & 0x7f;
    len = 0;
    for (let i = 0; i < n; i++) len = (len << 8) | buf[offset + 2 + i];
    contentStart = offset + 2 + n;
  }
  return { tag, start: offset, contentStart, end: contentStart + len, buf };
}

export function children(node: Node): Node[] {
  const out: Node[] = [];
  let p = node.contentStart;
  while (p < node.end) {
    const c = readNode(node.buf, p);
    out.push(c);
    p = c.end;
  }
  return out;
}

export const content = (n: Node) => n.buf.subarray(n.contentStart, n.end);
export const whole = (n: Node) => n.buf.subarray(n.start, n.end);

export function decodeOid(n: Node): string {
  const b = content(n);
  const parts: number[] = [Math.floor(b[0] / 40), b[0] % 40];
  let v = 0;
  for (let i = 1; i < b.length; i++) {
    v = (v << 7) | (b[i] & 0x7f);
    if (!(b[i] & 0x80)) {
      parts.push(v);
      v = 0;
    }
  }
  return parts.join(".");
}
