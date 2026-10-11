import type { Plugin } from "vite";
import {
  NOT_FOUND_META,
  PREVIEW_SHELL_META,
  ROUTE_META,
  SITE_NAME,
  SITE_ORIGIN,
  type RouteMeta,
} from "./src/data/route-meta";

// Writes one HTML file per route from the built index.html, each with its own
// title, description, canonical link, and crawler-visible fallback copy, and
// a sitemap.xml listing the indexable routes.
//
// The CloudFront viewer-request function in infrastructure-stack.ts maps URLs
// onto these files: "/foo" -> "/foo/index.html", "/preview/<id>" ->
// "/preview-shell.html". Anything without a file falls through to 404.html,
// served with a real 404 status.

const PREVIEW_SHELL_FILE = "preview-shell.html";

// Link preview card image (Discord, X, Bluesky, iMessage, ...), shown as a
// large banner card. X shows only the image, so it carries the message itself.
const SOCIAL_IMAGE = {
  path: "/og-image.png",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME}: live preview for AO3 HTML and workskins, showing chat-bubble workskin CSS beside its AO3 preview`,
};
const NOT_FOUND_FILE = "404.html";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function replaceOnce(html: string, pattern: RegExp, replacement: string, what: string): string {
  if (!pattern.test(html)) {
    throw new Error(`prerender-routes: couldn't find ${what} in index.html`);
  }
  return html.replace(pattern, () => replacement);
}

function headTags(route: RouteMeta): string {
  const url = `${SITE_ORIGIN}${route.path}`;
  const tags = [
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(route.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`,
    `<meta property="og:image" content="${SITE_ORIGIN}${SOCIAL_IMAGE.path}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="${SOCIAL_IMAGE.width}" />`,
    `<meta property="og:image:height" content="${SOCIAL_IMAGE.height}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(SOCIAL_IMAGE.alt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ];

  if (route.noindex) {
    tags.push(`<meta name="robots" content="noindex" />`);
  } else {
    tags.push(`<link rel="canonical" href="${url}" />`);
    tags.push(`<meta property="og:url" content="${url}" />`);
  }

  if (route.path === "/") {
    const structuredData = [
      { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: `${SITE_ORIGIN}/` },
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: SITE_NAME,
        url: `${SITE_ORIGIN}/`,
        description: route.description,
        applicationCategory: "DesignApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    ];
    // "<" can't appear in JSON-LD here, but escape it anyway so the script
    // tag can never be closed early.
    const json = JSON.stringify(structuredData).replace(/</g, "\\u003c");
    tags.push(`<script type="application/ld+json">${json}</script>`);
  }

  return tags.map((tag) => `    ${tag}`).join("\n");
}

// Plain, inline-styled copy that sits in #root until React mounts and
// replaces it. Mirrors the app's font and accent colour so the hand-off
// doesn't jar.
function fallbackContent(route: RouteMeta): string {
  const paragraphs = route.body.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  const links = ROUTE_META.map(
    (r) => `<a href="${r.path}" style="color:#7b1d1d;margin-right:1rem">${escapeHtml(r.navLabel)}</a>`,
  ).join("");
  return (
    `<div style="max-width:640px;margin:0 auto;padding:2rem;font-family:'Lucida Grande',Verdana,sans-serif;line-height:1.5;color:rgba(0,0,0,0.87)">` +
    `<h1 style="color:#7b1d1d;font-size:1.75rem;font-weight:normal">${escapeHtml(route.heading)}</h1>` +
    paragraphs +
    `<nav aria-label="${SITE_NAME}">${links}</nav>` +
    `</div>`
  );
}

function renderSitemap(routes: readonly RouteMeta[]): string {
  const urls = routes
    .filter((route) => !route.noindex)
    .map((route) => {
      const lastmod = route.lastmod ? `\n    <lastmod>${route.lastmod}</lastmod>` : "";
      return `  <url>\n    <loc>${SITE_ORIGIN}${route.path}</loc>${lastmod}\n  </url>`;
    });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

function renderRoute(template: string, route: RouteMeta): string {
  let html = template;
  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(route.title)}</title>`, "<title>");
  html = replaceOnce(
    html,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${escapeHtml(route.description)}" />`,
    "the description meta tag",
  );
  html = replaceOnce(html, /\s*<\/head>/, `\n${headTags(route)}\n  </head>`, "</head>");
  html = replaceOnce(
    html,
    /<div id="root"><\/div>/,
    `<div id="root">${fallbackContent(route)}</div>`,
    'the empty <div id="root">',
  );
  return html;
}

export default function prerenderRoutes(): Plugin {
  return {
    name: "prerender-routes",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const shell = bundle["index.html"];
      if (!shell || shell.type !== "asset") {
        this.error("prerender-routes: index.html missing from the bundle");
      }
      const template = String(shell.source);

      for (const route of ROUTE_META) {
        const html = renderRoute(template, route);
        if (route.path === "/") {
          shell.source = html;
        } else {
          this.emitFile({ type: "asset", fileName: `${route.path.slice(1)}/index.html`, source: html });
        }
      }
      this.emitFile({
        type: "asset",
        fileName: PREVIEW_SHELL_FILE,
        source: renderRoute(template, PREVIEW_SHELL_META),
      });
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: renderSitemap(ROUTE_META) });
      this.emitFile({
        type: "asset",
        fileName: NOT_FOUND_FILE,
        source: renderRoute(template, NOT_FOUND_META),
      });
    },
  };
}
