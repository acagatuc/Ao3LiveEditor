import sanitizeHtml from "sanitize-html";

// Mirrors frontend/src/allowlist/ao3HtmlAllowlist.ts exactly — that file is the source of truth
const AO3_TAGS = [
  "a", "abbr", "acronym", "address", "b", "big", "blockquote", "br", "caption", "center",
  "cite", "code", "col", "colgroup", "dd", "del", "details", "dfn", "div", "dl", "dt",
  "em", "figcaption", "figure", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "ins",
  "kbd", "li", "ol", "p", "pre", "q", "rp", "rt", "ruby", "s", "samp", "small", "span",
  "strike", "strong", "sub", "summary", "sup", "table", "tbody", "td", "tfoot", "th", "thead",
  "tr", "tt", "u", "ul", "var",
];

// class is handled by allowedClasses below, so it isn't listed here.
const AO3_GLOBAL_ATTRS = ["align", "dir", "lang", "title"];

const AO3_ATTRS_BY_TAG: Record<string, string[]> = {
  a: ["href", "name"],
  blockquote: ["cite"],
  col: ["span", "width"],
  colgroup: ["span", "width"],
  details: ["open"],
  hr: ["align", "width"],
  img: ["align", "alt", "border", "height", "src", "width"],
  ol: ["start", "type"],
  q: ["cite"],
  table: ["border", "summary", "width"],
  td: ["abbr", "axis", "colspan", "height", "rowspan", "width"],
  th: ["abbr", "axis", "colspan", "height", "rowspan", "scope", "width"],
  ul: ["type"],
};

const AO3_REMOVE_CONTENTS = [
  "iframe", "math", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "xmp",
];

export function sanitizeHtmlContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: AO3_TAGS,
    allowedAttributes: { "*": AO3_GLOBAL_ATTRS, ...AO3_ATTRS_BY_TAG },
    allowedClasses: { "*": [/^[a-zA-Z][\w-]+$/] },
    allowedSchemesByTag: {
      a: ["ftp", "http", "https", "mailto"],
      blockquote: ["http", "https"],
      img: ["http", "https"],
      q: ["http", "https"],
    },
    // Relative and protocol-relative image sources are kept as written (sanitize-html's default),
    // matching the frontend. AO3 would resolve them against its own domain instead.
    nonTextTags: AO3_REMOVE_CONTENTS,
  });
}

// Mirrors frontend/src/allowlist/cssAllowedProperties.ts DISALLOWED_AT_RULES
const DISALLOWED_AT_RULES = ["@font-face", "@import"];

export function sanitizeCss(css: string): string {
  let result = css.replace(/<[^>]*>/g, "");
  for (const rule of DISALLOWED_AT_RULES) {
    result = result.replace(new RegExp(rule + "\\b[^;]*(;|$)", "gi"), "");   // statement rules
    result = result.replace(new RegExp(rule + "\\b[^{]*\\{[^}]*\\}", "gi"), ""); // block rules
  }
  return result;
}
