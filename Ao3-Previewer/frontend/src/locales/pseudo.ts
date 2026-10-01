import type { ResourceKey, ResourceLanguage } from "i18next";

const ACCENTED: Record<string, string> = {
  a: "å", b: "ƀ", c: "ç", d: "ð", e: "é", f: "ƒ", g: "ĝ", h: "ĥ", i: "î", j: "ĵ", k: "ķ", l: "ļ",
  m: "ɱ", n: "ñ", o: "ö", p: "þ", q: "ǫ", r: "ŕ", s: "š", t: "ţ", u: "û", v: "ṽ", w: "ŵ", x: "ẋ",
  y: "ý", z: "ž", A: "Å", B: "Ɓ", C: "Ç", D: "Ð", E: "É", F: "Ƒ", G: "Ĝ", H: "Ĥ", I: "Î", J: "Ĵ",
  K: "Ķ", L: "Ļ", M: "Ṁ", N: "Ñ", O: "Ö", P: "Þ", Q: "Ǫ", R: "Ŕ", S: "Š", T: "Ţ", U: "Û", V: "Ṽ",
  W: "Ŵ", X: "Ẋ", Y: "Ý", Z: "Ž",
};

// Leaves {{placeholders}} and <tag>component tags</tag> untouched so interpolation still works.
const PROTECTED = /(\{\{[^}]+\}\}|<\/?[a-zA-Z0-9]+\s*\/?>)/;

function pseudoString(value: string): string {
  const accented = value
    .split(PROTECTED)
    .map((part, i) => (i % 2 === 1 ? part : part.replace(/[a-zA-Z]/g, (ch) => ACCENTED[ch] ?? ch)))
    .join("");
  // Pad by ~30% to approximate longer languages like French or German.
  // Tildes are space-separated so they wrap rather than forming one long unbreakable token.
  // Half the count since each " ~" pair occupies two characters.
  const padding = " ~".repeat(Math.ceil(value.length * 0.15));
  return `[${accented}${padding}]`;
}

function pseudoValue(value: ResourceKey): ResourceKey {
  if (typeof value === "string") return pseudoString(value);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, pseudoValue(v)]));
  }
  return value;
}

export function buildPseudoLocale(source: ResourceLanguage): ResourceLanguage {
  return pseudoValue(source) as ResourceLanguage;
}
