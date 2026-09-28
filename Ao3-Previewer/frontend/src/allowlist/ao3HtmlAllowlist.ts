// AO3-allowed HTML tags and attributes for user-submitted content.
// Source of truth: AO3's sanitizer config (Sanitize::Config::ARCHIVE + CLASS_ATTRIBUTE)
// https://github.com/otwcode/otwarchive/blob/master/config/initializers/gem-plugin_config/sanitizer_config.rb
// The FAQ list (https://archiveofourown.org/faq/formatting-content-on-ao3-with-html#canihtml) is close but
// not exact, e.g. it lists <dir>, which the sanitizer does not allow.

export const AO3_ALLOWED_TAGS = [
  "a",
  "abbr",
  "acronym",
  "address",
  "b",
  "big",
  "blockquote",
  "br",
  "caption",
  "center",
  "cite",
  "code",
  "col",
  "colgroup",
  "dd",
  "del",
  "details",
  "dfn",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "ins",
  "kbd",
  "li",
  "ol",
  "p",
  "pre",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "small",
  "span",
  "strike",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "tt",
  "u",
  "ul",
  "var",
];

// Attributes allowed on every tag. AO3 allows class on works that can use a work skin.
export const AO3_GLOBAL_ATTRS = ["align", "dir", "lang", "title", "class"];

// Attributes allowed only on specific tags, in addition to AO3_GLOBAL_ATTRS.
export const AO3_ATTRS_BY_TAG: Record<string, string[]> = {
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

// Disallowed tags are unwrapped (their text is kept), except these, which are removed with their contents.
export const AO3_REMOVE_CONTENTS = [
  "iframe",
  "math",
  "noembed",
  "noframes",
  "noscript",
  "plaintext",
  "script",
  "style",
  "svg",
  "xmp",
];

// Allowed URL protocols per tag and attribute. "relative" means a URL with no protocol.
export const AO3_URL_PROTOCOLS: Record<string, Record<string, string[]>> = {
  a: { href: ["ftp", "http", "https", "mailto", "relative"] },
  blockquote: { cite: ["http", "https", "relative"] },
  // AO3 resolves relative image sources against its own domain before this check. We leave them
  // as written instead, since they'd only ever point at files on AO3's server.
  img: { src: ["http", "https", "relative"] },
  q: { cite: ["http", "https", "relative"] },
};

// Class names that don't match are dropped (must start with a letter and be at least 2 characters).
export const AO3_CLASS_NAME = /^[a-zA-Z][\w-]+$/;

// Flat list of every attribute AO3 allows on any tag, for sanitizers without per-tag rules (DOMPurify).
export const AO3_ALLOWED_ATTR = [
  ...new Set([...AO3_GLOBAL_ATTRS, ...Object.values(AO3_ATTRS_BY_TAG).flat()]),
];
