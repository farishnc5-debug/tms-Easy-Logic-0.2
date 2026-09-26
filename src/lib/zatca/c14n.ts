import type { Element as XmlElement, Node as XmlNode } from "@xmldom/xmldom";

// Small XML canonicalizer for the invoice documents we generate (no comments,
// processing instructions or CDATA). Implements Canonical XML 1.0/1.1 rules
// ("inclusive") and Exclusive C14N, on @xmldom/xmldom DOM nodes.
//   inclusive: every in-scope namespace of the apex element is emitted
//   exclusive: only namespaces actually used by an element/attribute are emitted

const ELEMENT = 1;
const TEXT = 3;

const escText = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r/g, "&#xD;");
const escAttr = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/\t/g, "&#x9;")
    .replace(/\n/g, "&#xA;")
    .replace(/\r/g, "&#xD;");

function inScopeNamespaces(el: XmlElement): Map<string, string> {
  const chain: XmlElement[] = [];
  for (let n: XmlNode | null = el; n && n.nodeType === ELEMENT; n = n.parentNode) chain.unshift(n as XmlElement);
  const ns = new Map<string, string>();
  for (const e of chain) {
    for (let i = 0; i < e.attributes.length; i++) {
      const a = e.attributes[i];
      if (a.name === "xmlns") ns.set("", a.value);
      else if (a.name.startsWith("xmlns:")) ns.set(a.name.slice(6), a.value);
    }
  }
  return ns;
}

export function canonicalize(
  root: XmlElement,
  opts: { mode: "inclusive" | "exclusive"; skip?: (n: XmlNode) => boolean },
): string {
  const scope = inScopeNamespaces(root);
  const out: string[] = [];

  function visit(el: XmlElement, inherited: Map<string, string>, emittedAbove: Map<string, string>) {
    const localScope = new Map(inherited);
    const attrs: { ns: string; local: string; name: string; value: string }[] = [];
    for (let i = 0; i < el.attributes.length; i++) {
      const a = el.attributes[i];
      if (a.name === "xmlns") localScope.set("", a.value);
      else if (a.name.startsWith("xmlns:")) localScope.set(a.name.slice(6), a.value);
      else attrs.push({ ns: a.namespaceURI ?? "", local: a.localName ?? a.name, name: a.name, value: a.value });
    }

    // Which namespace declarations to emit on this element
    const candidates = new Set<string>();
    if (opts.mode === "inclusive") {
      for (const p of localScope.keys()) candidates.add(p);
    } else {
      const prefixOf = (qn: string) => (qn.includes(":") ? qn.split(":")[0] : "");
      candidates.add(prefixOf(el.tagName));
      for (const a of attrs) if (a.name.includes(":")) candidates.add(prefixOf(a.name));
    }
    const decls: [string, string][] = [];
    for (const p of candidates) {
      const uri = localScope.get(p);
      if (uri === undefined) continue;
      if (emittedAbove.get(p) === uri) continue;
      if (p === "" && uri === "" && !emittedAbove.has("")) continue;
      decls.push([p, uri]);
    }
    decls.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    attrs.sort((a, b) => (a.ns + a.local < b.ns + b.local ? -1 : a.ns + a.local > b.ns + b.local ? 1 : 0));

    const nowEmitted = new Map(emittedAbove);
    let start = `<${el.tagName}`;
    for (const [p, uri] of decls) {
      start += p ? ` xmlns:${p}="${escAttr(uri)}"` : ` xmlns="${escAttr(uri)}"`;
      nowEmitted.set(p, uri);
    }
    for (const a of attrs) start += ` ${a.name}="${escAttr(a.value)}"`;
    out.push(start + ">");

    for (let c = el.firstChild; c; c = c.nextSibling) {
      if (opts.skip?.(c)) continue;
      if (c.nodeType === ELEMENT) visit(c as XmlElement, localScope, nowEmitted);
      else if (c.nodeType === TEXT) out.push(escText(c.nodeValue ?? ""));
    }
    out.push(`</${el.tagName}>`);
  }

  // apex: nothing emitted yet, but the parent context supplies in-scope namespaces
  const parentScope = new Map(scope);
  for (let i = 0; i < root.attributes.length; i++) {
    const a = root.attributes[i];
    if (a.name === "xmlns") parentScope.delete("");
    else if (a.name.startsWith("xmlns:")) parentScope.delete(a.name.slice(6));
  }
  visit(root, parentScope, new Map());
  return out.join("");
}
