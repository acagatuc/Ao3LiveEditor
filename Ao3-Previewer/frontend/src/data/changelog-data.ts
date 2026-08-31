export type ChangeType = 'added' | 'fixed' | 'improved' | 'removed'

export interface ChangelogChange {
  type: ChangeType
  description: string
}

export interface ChangelogRelease {
  date: string
  title: string
  changes: ChangelogChange[]
}

export const CHANGELOG: ChangelogRelease[] = [
  {
    date: '2026-05-17',
    title: 'Format for AO3',
    changes: [
      { type: 'added', description: 'Format for AO3 button in the HTML editor — wraps bare text in <p> tags and strips HTML-style indentation whitespace while preserving newlines' },
      { type: 'added', description: 'AO3 base styles applied in the preview iframe so spacing, fonts, and layout match an actual AO3 work page' },
      { type: 'added', description: 'Preview automatically normalizes paragraph structure to mirror AO3\'s render behavior' },
      { type: 'improved', description: 'Shared preview page shows a notice that the preview is normalized to match AO3 rendering' },
    ],
  },
  {
    date: '2026-05-03',
    title: 'Validation & infrastructure',
    changes: [
      { type: 'added', description: 'Server-side validation for HTML and CSS on shared previews' },
      { type: 'added', description: 'Sitemap and updated robots.txt' },
      { type: 'added', description: 'Favicons' },
      { type: 'improved', description: 'Dev stack separated from production for safer local development' },
      { type: 'improved', description: 'Build output uses manual chunking for better caching' },
    ],
  },
  {
    date: '2026-04-30',
    title: 'Bug fixes & contact form',
    changes: [
      { type: 'fixed', description: 'Text-align options in the rich text editor not applying correctly' },
      { type: 'fixed', description: 'CSS linter incorrectly flagging hex color values as invalid units' },
      { type: 'added', description: 'HTML allowlist — only safe, AO3-supported tags are permitted in the preview' },
      { type: 'added', description: 'Contact form on the Roadmap page for bug reports and feature requests' },
    ],
  },
  {
    date: '2026-04-27',
    title: 'Shareable previews & domain launch',
    changes: [
      { type: 'added', description: 'Share Preview — generate a shareable link to your current HTML/CSS preview' },
      { type: 'added', description: 'Shared preview page with title, author, expiry display, and Hide Creator\'s Style toggle' },
      { type: 'added', description: 'FicFormatter launched on its own domain' },
      { type: 'improved', description: 'Preview pane padding adjusted to more closely match AO3\'s work page layout' },
    ],
  },
  {
    date: '2026-04-26',
    title: 'Rich text editor & security',
    changes: [
      { type: 'added', description: 'Rich text editor — write and format fanfic without touching HTML directly' },
      { type: 'improved', description: 'Security hardening across the frontend' },
      { type: 'added', description: 'Sentry error logging for improved diagnostics' },
    ],
  },
]
