import sanitizeHtml from "sanitize-html";

// Mirrors frontend/src/allowlist/ao3HtmlAllowlist.ts exactly — that file is the source of truth
const AO3_TAGS = [
  "a", "abbr", "acronym", "address", "b", "big", "blockquote", "br", "caption", "center",
  "cite", "code", "col", "colgroup", "dd", "del", "details", "dfn", "dir", "div", "dl", "dt",
  "em", "figcaption", "figure", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "ins",
  "kbd", "li", "ol", "p", "pre", "q", "rp", "rt", "ruby", "s", "samp", "small", "span",
  "strike", "strong", "sub", "summary", "sup", "table", "tbody", "td", "tfoot", "th", "thead",
  "tr", "tt", "u", "ul", "var",
];

const AO3_ATTRS = [
  "align", "alt", "axis", "class", "height", "href", "name", "src", "target", "title", "width",
];

export function sanitizeHtmlContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: AO3_TAGS,
    allowedAttributes: { "*": AO3_ATTRS },
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
