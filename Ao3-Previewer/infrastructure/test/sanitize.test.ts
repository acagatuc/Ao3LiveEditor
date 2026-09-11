import { describe, it, expect } from "@jest/globals";
import { sanitizeHtmlContent, sanitizeCss } from "../functions/shared/sanitize";

describe("sanitizeHtmlContent", () => {
  it("passes through AO3-allowed tags and attributes unchanged", () => {
    const html = '<p>Hello <b>world</b>, <a href="https://example.com" title="link">click</a></p>';
    expect(sanitizeHtmlContent(html)).toBe(html);
  });

  it("strips script tags and their contents", () => {
    const html = '<p>Safe</p><script>alert("xss")</script>';
    const result = sanitizeHtmlContent(html);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("alert");
  });

  it("strips inline event handler attributes", () => {
    const html = '<img src="a.png" onerror="alert(1)">';
    const result = sanitizeHtmlContent(html);
    expect(result).not.toContain("onerror");
  });

  it("strips javascript: URLs from href", () => {
    const html = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeHtmlContent(html);
    expect(result).not.toContain("javascript:");
  });

  it("strips disallowed tags but keeps their text content", () => {
    const html = "<style>body{color:red}</style><p>Text</p>";
    const result = sanitizeHtmlContent(html);
    expect(result).not.toContain("<style>");
    expect(result).toContain("<p>Text</p>");
  });

  it("strips the style attribute, which is not in the AO3 allowlist", () => {
    const html = '<p style="color:red">Text</p>';
    const result = sanitizeHtmlContent(html);
    expect(result).not.toContain("style=");
  });

  it("keeps img tags with allowed attributes", () => {
    const html = '<img src="https://example.com/pic.png" alt="a picture" width="100">';
    const result = sanitizeHtmlContent(html);
    expect(result).toContain('src="https://example.com/pic.png"');
    expect(result).toContain('alt="a picture"');
  });
});

describe("sanitizeCss", () => {
  it("passes through ordinary declarations unchanged", () => {
    const css = ".foo { color: red; background: url(https://example.com/bg.png); }";
    expect(sanitizeCss(css)).toBe(css);
  });

  it("allows url() background images from arbitrary hosts (AO3 skins permit this)", () => {
    const css = ".foo { background-image: url(https://cdn.example.com/img.jpg); }";
    expect(sanitizeCss(css)).toContain("url(https://cdn.example.com/img.jpg)");
  });

  it("strips @import statement rules", () => {
    const css = '@import url("evil.css"); .foo { color: red; }';
    const result = sanitizeCss(css);
    expect(result).not.toContain("@import");
    expect(result).toContain(".foo { color: red; }");
  });

  it("strips @font-face block rules", () => {
    const css = '@font-face { font-family: "Evil"; src: url("evil.woff"); } .foo { color: blue; }';
    const result = sanitizeCss(css);
    expect(result).not.toContain("@font-face");
    expect(result).toContain(".foo { color: blue; }");
  });

  it("strips HTML tags embedded in CSS", () => {
    const css = '.foo { color: red; } </style><script>alert(1)</script>';
    const result = sanitizeCss(css);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("</style>");
  });

  it("is case-insensitive for disallowed at-rules", () => {
    const css = '@IMPORT url("evil.css");';
    expect(sanitizeCss(css)).not.toContain("evil.css");
  });
});
