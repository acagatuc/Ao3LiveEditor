export type ChangeType = "added" | "fixed" | "improved" | "removed";

export interface ChangelogChange {
  type: ChangeType;
  description: string;
}

export interface ChangelogRelease {
  version: string;
  date: string;
  title: string;
  changes: ChangelogChange[];
}

// Newest first. Derived from the real commit history on main.
export const CHANGELOG: ChangelogRelease[] = [
  {
    version: "0.10.0",
    date: "2026-09-16",
    title: "Drafts",
    changes: [
      {
        type: "added",
        description:
          "Save Draft button in both the HTML/CSS and Rich Text editors, so you can save your work-in-progress and come back to it later",
      },
      {
        type: "added",
        description:
          "My Drafts menu in the header - reopen a recent draft in one click, or open the full list to rename, delete, or browse everything you've saved",
      },
      {
        type: "improved",
        description:
          "My Drafts reminds you that drafts are saved to this browser only, not an account - as with AO3 itself, keep a copy of anything important saved elsewhere too",
      },
    ],
  },
  {
    version: "0.9.0",
    date: "2026-09-10",
    title: "Changelog page, Contact page & Roadmap retirement",
    changes: [
      {
        type: "added",
        description:
          "Changelog page (this page!) - real release history with the date and version as the headline for each entry",
      },
      {
        type: "added",
        description:
          "Unread indicator on the Changelog nav button when a new release hasn't been viewed yet",
      },
      {
        type: "added",
        description:
          "Upcoming section on the Changelog page showing what's in progress and planned",
      },
      {
        type: "added",
        description:
          "Dedicated Contact page - the contact form now has its own home instead of sharing space with the roadmap",
      },
      {
        type: "added",
        description:
          "Featured shoutout on the Workskins page linking to fanfictemplates.com, a fellow dev's free CSS tools for AO3",
      },
      {
        type: "removed",
        description:
          "Roadmap page - superseded by the Changelog page's Upcoming section and the standalone Contact page",
      },
      {
        type: "improved",
        description:
          'External link button supports a larger, more prominent style for calls to action, while keeping the "leaving FicFormatter" confirmation',
      },
      {
        type: "improved",
        description: "Sitemap updated for the new Changelog and Contact pages",
      },
    ],
  },
  {
    version: "0.8.1",
    date: "2026-08-31",
    title: "Summary Bugfix",
    changes: [
      {
        type: "fixed",
        description:
          "HTML normalization misreading a <summary> tag on its own line as a standalone node instead of part of its parent <details> line",
      },
    ],
  },
  {
    version: "0.8.0",
    date: "2026-05-17",
    title: "Formatting for AO3",
    changes: [
      {
        type: "added",
        description:
          "Format for AO3 button in the HTML editor - wraps bare text in <p> tags and strips HTML-style indentation whitespace while preserving newlines",
      },
      {
        type: "added",
        description:
          "AO3 base styles applied in the preview iframe so spacing, fonts, and layout match an actual AO3 work page",
      },
      {
        type: "added",
        description:
          "Preview automatically normalizes paragraph structure to mirror AO3's render behavior",
      },
      {
        type: "improved",
        description:
          "Shared preview page shows a notice that the preview is normalized to match AO3 rendering",
      },
    ],
  },
  {
    version: "0.7.0",
    date: "2026-05-03",
    title: "Validation & infrastructure",
    changes: [
      {
        type: "added",
        description:
          "Server-side validation for HTML and CSS on shared previews",
      },
      { type: "added", description: "Sitemap and updated robots.txt" },
      { type: "added", description: "Favicons" },
      {
        type: "improved",
        description:
          "Dev stack separated from production for safer local development",
      },
      {
        type: "improved",
        description: "Build output uses manual chunking for better caching",
      },
      { type: "improved", description: "Refined analytics tracking" },
    ],
  },
  {
    version: "0.6.0",
    date: "2026-04-30",
    title: "Bug fixes & contact form",
    changes: [
      {
        type: "fixed",
        description:
          "Text-align options in the rich text editor not applying correctly",
      },
      {
        type: "fixed",
        description:
          "CSS linter incorrectly flagging hex color values as invalid units",
      },
      {
        type: "added",
        description:
          "HTML allowlist - only safe, AO3-supported tags are permitted in the preview",
      },
      {
        type: "added",
        description:
          "Contact form on the Roadmap page for bug reports and feature requests",
      },
    ],
  },
  {
    version: "0.5.0",
    date: "2026-04-27",
    title: "Shareable previews & domain launch",
    changes: [
      {
        type: "added",
        description:
          "Share Preview - generate a shareable link to your current HTML/CSS preview",
      },
      {
        type: "added",
        description:
          "Shared preview page with title, author, expiry display, and Hide Creator's Style toggle",
      },
      {
        type: "added",
        description: "Sentry error logging for improved diagnostics",
      },
      { type: "added", description: "FicFormatter launched on its own domain" },
      {
        type: "improved",
        description:
          "Preview pane padding adjusted to more closely match AO3's work page layout",
      },
      { type: "fixed", description: "Minor rich text editor bug" },
    ],
  },
  {
    version: "0.4.0",
    date: "2026-04-26",
    title: "Security & rich text updates",
    changes: [
      {
        type: "improved",
        description: "Security hardening across the frontend",
      },
      {
        type: "improved",
        description: "Rich text editor updates and refinements",
      },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-04-25",
    title: "React migration & rich text editor",
    changes: [
      {
        type: "added",
        description:
          "Rich text editor - write and format fanfic without touching HTML directly",
      },
      {
        type: "improved",
        description:
          "Rebuilt the frontend in React (from Vue), with AWS CDK infrastructure and GitHub Actions CI/CD",
      },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-02-28",
    title: "CSS linter",
    changes: [
      {
        type: "added",
        description:
          "CSS linter that validates properties and values against AO3's supported style rules",
      },
      {
        type: "added",
        description:
          "Warning banner and inline text overlay highlighting invalid CSS",
      },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-02-13",
    title: "Initial release",
    changes: [
      {
        type: "added",
        description: "Live HTML/CSS editor with real-time AO3-style preview",
      },
      { type: "added", description: "Auto-formatting for HTML and CSS" },
      { type: "added", description: "Copy and export buttons for quick reuse" },
      {
        type: "added",
        description: "HTML sanitization to prevent unsafe markup",
      },
      {
        type: "added",
        description:
          "Tooltip noting that links are disabled in the preview, to avoid confusion",
      },
      {
        type: "improved",
        description: "Synced scrolling between the editor and preview panes",
      },
    ],
  },
];
