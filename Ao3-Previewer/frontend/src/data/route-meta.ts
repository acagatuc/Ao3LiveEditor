// The list of public pages. Adding a page means adding it here; everything
// else is derived from this list:
// - App.tsx builds its <Route>s from it, and TypeScript requires a page
//   component for every path.
// - The prerender plugin (prerender-routes.ts) writes one HTML file per page
//   with its title, description, and fallback copy, plus sitemap.xml.
// - The CloudFront routing function serves "/foo" from "/foo/index.html", so a
//   page missing from this list would be served as a 404.
//
// Keep this file free of imports so the Vite config can load it.

export const SITE_ORIGIN = "https://ficformatter.com";
export const SITE_NAME = "FicFormatter";

export interface RouteMeta {
  // URL path as served, without a trailing slash ("/" for home).
  path: string;
  // Link text in the fallback copy's nav.
  navLabel: string;
  title: string;
  description: string;
  // Static copy rendered inside #root before the app mounts, so crawlers and
  // AI fetchers that don't run JavaScript still see what the page is.
  heading: string;
  body: readonly string[];
  // Last meaningful content change (YYYY-MM-DD), for sitemap.xml. Bump it
  // when the page itself changes.
  lastmod?: string;
  // Shells for dynamic routes are served for many URLs, so they get no
  // canonical link and aren't indexed.
  noindex?: boolean;
}

export const ROUTE_META = [
  {
    path: "/",
    navLabel: "HTML/CSS Previewer",
    title: "FicFormatter – AO3 HTML & CSS Live Previewer",
    description:
      "Live preview for AO3: edit HTML and workskin CSS side by side, see it rendered like AO3 before you post, and lint your CSS against AO3's rules.",
    heading: "Live preview for AO3 HTML and workskins, no draft needed",
    body: [
      "FicFormatter is a free live previewer for Archive of Our Own. Paste your chapter HTML and your workskin CSS, and see the result rendered the way AO3 will show it, as you type.",
      "The built-in CSS linter checks your workskin against the properties and selectors AO3 actually allows, so you find out what will be stripped before you post. You can also share a formatted preview link with beta readers.",
    ],
    lastmod: "2026-10-11",
  },
  {
    path: "/rich-text",
    navLabel: "Rich Text Editor",
    title: "AO3 Rich Text Editor – FicFormatter",
    description:
      "Format your fic visually and copy clean, AO3-ready HTML. A free rich text editor that only produces the tags AO3 allows.",
    heading: "Rich text editor for AO3-ready HTML",
    body: [
      "Write or paste your chapter, format it with bold, italics, alignment, and images, and copy out AO3-ready HTML.",
      "Open the result in the HTML/CSS previewer to add a workskin and see the finished chapter in a live preview.",
    ],
    lastmod: "2026-10-11",
  },
  {
    path: "/workskins",
    navLabel: "Workskins",
    title: "AO3 Workskins – FicFormatter",
    description:
      "Community AO3 workskins and CSS effects you can copy and try in the live previewer before you post.",
    heading: "Community AO3 workskins",
    body: [
      "Workskins and CSS effects for AO3, with community submissions on the way. Copy the CSS, or open it in the live previewer to try it on your own chapter before you post.",
    ],
    lastmod: "2026-10-11",
  },
  {
    path: "/bookmarks",
    navLabel: "Bookmark Search",
    title: "AO3 Bookmark Search – FicFormatter",
    description:
      "Find public AO3 bookmarks of an author's works, filtered to recommendations or bookmarks with notes.",
    heading: "AO3 bookmark search",
    body: [
      "Enter an AO3 username to find the public bookmarks other readers have left on that author's works. Filter to recommendations only or to bookmarks with notes, and sort by date.",
    ],
    lastmod: "2026-10-11",
  },
  {
    path: "/changelog",
    navLabel: "Changelog",
    title: "Changelog – FicFormatter",
    description: "What's new in FicFormatter: releases, fixes, and features on the way.",
    heading: "FicFormatter changelog",
    body: ["A history of what's changed in FicFormatter, and what's planned next."],
    lastmod: "2026-10-11",
  },
  {
    path: "/contact",
    navLabel: "Contact",
    title: "Contact – FicFormatter",
    description: "Send FicFormatter a bug report, feature request, or workskin submission.",
    heading: "Contact FicFormatter",
    body: ["Bug reports, feature requests, workskin submissions, or just to say hello."],
    lastmod: "2026-10-11",
  },
] as const satisfies readonly RouteMeta[];

export type RoutePath = (typeof ROUTE_META)[number]["path"];

// Served for every /preview/<id> URL.
export const PREVIEW_SHELL_META: RouteMeta = {
  path: "/preview",
  navLabel: "Shared Preview",
  title: "Shared Preview – FicFormatter",
  description: "A formatted AO3 fic preview shared from FicFormatter.",
  heading: "Shared preview",
  body: ["Loading this shared preview…"],
  noindex: true,
};

export const NOT_FOUND_META: RouteMeta = {
  path: "/404",
  navLabel: "Page not found",
  title: "Page not found – FicFormatter",
  description: "This page doesn't exist on FicFormatter.",
  heading: "Page not found",
  body: [
    "There's nothing at this address. FicFormatter's tools are the HTML/CSS previewer, the rich text editor, workskins, and bookmark search.",
  ],
  noindex: true,
};

export function findRouteMeta(pathname: string): RouteMeta {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (path.startsWith("/preview/")) return PREVIEW_SHELL_META;
  return ROUTE_META.find((r) => r.path === path) ?? NOT_FOUND_META;
}
