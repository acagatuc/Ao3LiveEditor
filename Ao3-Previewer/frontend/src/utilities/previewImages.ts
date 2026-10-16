import i18n from '../i18n'
import { sanitizeHtml } from './sanitizeHtml'

export type ImageProblemReason =
  | 'empty'
  | 'brokenTag'
  | 'extraCharacters'
  | 'relativePath'
  | 'placeholderText'

export interface ImageProblem {
  src: string
  reason: ImageProblemReason
}

const ADDRESS_MAX_LENGTH = 40

/**
 * Why an img src won't load on AO3, or null if it will. AO3 only keeps http(s) image sources.
 * Protocol-relative "//host/path" counts as loadable: AO3 joins it onto its https URL, which
 * gives "https://host/path".
 */
export function imageSrcProblem(src: string | null): ImageProblemReason | null {
  const trimmed = (src ?? '').trim()
  if (!trimmed) return 'empty'
  // A missing closing quote pulls the next tag into the address.
  if (/[<>"]/.test(trimmed)) return 'brokenTag'
  if (/^(https?:)?\/\//i.test(trimmed)) return null
  if (/https?:/i.test(trimmed)) return 'extraCharacters'
  if (looksLikePath(trimmed)) return 'relativePath'
  return 'placeholderText'
}

function looksLikePath(src: string): boolean {
  if (/[\s[\]{}"']/.test(src)) return false
  return /^\.{0,2}\//.test(src) || /\.[a-z0-9]{2,5}([?#].*)?$/i.test(src)
}

/**
 * Lists the images in the user's HTML that the preview will show as placeholders. Runs on the
 * sanitized HTML, while the preview runs replaceUnloadableImages after normalizeForAo3 too.
 * normalizeForAo3 doesn't change img src, so both find the same images; if it ever does, use the
 * same pipeline in both or the warning count and the placeholders will disagree.
 */
export function listImageProblems(html: string): ImageProblem[] {
  const doc = new DOMParser().parseFromString(sanitizeHtml(html), 'text/html')
  return findImageProblems(doc).map(({ src, reason }) => ({ src, reason }))
}

function findImageProblems(doc: Document): (ImageProblem & { img: HTMLImageElement })[] {
  return Array.from(doc.querySelectorAll('img')).flatMap((img) => {
    const src = img.getAttribute('src') ?? ''
    const reason = imageSrcProblem(src)
    return reason ? [{ img, src, reason }] : []
  })
}

/**
 * Points images that can't load at an inline placeholder, so the preview never requests them.
 * A srcdoc resolves relative addresses against our own site, so each keystroke would otherwise
 * refetch every one and get a 404. The img keeps its other attributes so skins still match it.
 */
export function replaceUnloadableImages(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const problems = findImageProblems(doc)
  if (problems.length === 0) return html

  const note = i18n.t('editor:preview.imagePlaceholder')
  for (const { img, src } of problems) {
    img.setAttribute('src', imagePlaceholderSrc(note, src))
    img.setAttribute('title', src)
  }
  return doc.body.innerHTML
}

/**
 * A data: URI for a dashed gray box with an image icon, a note, and the address the user typed.
 * The SVG's 300x150 size (the browser default for images) keeps it from collapsing when the img
 * has no width or height. It has no viewBox, so at any other size the box stretches to fill the
 * img and the icon and text stay unscaled in the middle.
 */
export function imagePlaceholderSrc(note: string, address: string): string {
  const shown = address.length > ADDRESS_MAX_LENGTH
    ? `${address.slice(0, ADDRESS_MAX_LENGTH - 1)}…`
    : address
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" font-family="sans-serif" text-anchor="middle">`
    + `<rect width="100%" height="100%" fill="#f2f2f2" stroke="#999" stroke-width="4" stroke-dasharray="8 5"/>`
    + `<svg x="50%" y="50%" overflow="visible">`
    + `<g fill="none" stroke="#888" stroke-width="2"><rect x="-14" y="-42" width="28" height="22" rx="2"/>`
    + `<polyline points="-10,-24 -3,-32 2,-27 6,-30 10,-24"/><circle cx="5" cy="-36" r="2"/></g>`
    + `<text y="2" font-size="13" fill="#555">${escapeXml(note)}</text>`
    + (shown ? `<text y="22" font-size="11" fill="#777" font-family="monospace">${escapeXml(shown)}</text>` : '')
    + `</svg></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * Script for the srcdoc head: swaps an http(s) image that fails to load, such as a dead link on
 * another site, for a placeholder. Capture phase, because error events don't bubble.
 */
export function failedImageScript(): string {
  const marker = 'FF_ADDRESS_MARKER'
  const template = imagePlaceholderSrc(i18n.t('editor:preview.imageFailedPlaceholder'), marker)
  return `
    (function() {
      var template = ${JSON.stringify(template).replace(/</g, '\\u003c')};
      var maxLength = ${ADDRESS_MAX_LENGTH};
      function escapeXml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
      }
      document.addEventListener('error', function(e) {
        var img = e.target;
        if (!img || img.tagName !== 'IMG' || !/^https?:/i.test(img.src)) return;
        var address = img.getAttribute('src') || '';
        var shown = address.length > maxLength ? address.slice(0, maxLength - 1) + '\\u2026' : address;
        img.src = template.replace('${marker}', encodeURIComponent(escapeXml(shown)));
        img.title = address;
      }, true);
    })();`
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
