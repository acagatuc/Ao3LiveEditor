import {
  ALLOWED_UNITS,
  ALLOWED_IMAGE_FORMATS,
  MAX_DECIMAL_PLACES,
} from '../allowlist/cssAllowedProperties'
import type { LintMessage } from './lintMessage'

export interface ValueValidationResult {
  valid: boolean
  reason?: LintMessage
}

const FLOAT_REGEX = /\d+\.(\d+)/g
// A number followed by its unit. The lookbehind skips digits inside words like "translate3d".
const DIMENSION_REGEX = /(?<![\w.])(-?\d*\.?\d+)([a-z%]+)/gi
const URL_REGEX = /url\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi

export function validateValue(value: string, _property: string): ValueValidationResult {
  if (!value?.trim()) return { valid: false, reason: { key: 'emptyValue' } }

  const v = value.trim()

  if (/\bvar\s*\(/.test(v)) {
    return { valid: false, reason: { key: 'varNotAllowed' } }
  }

  // Image URLs are checked first and then removed, so letters and digits inside them
  // (e.g. ".../yc5dDRns/...") aren't mistaken for numbers with units below.
  const imageProblem = imageUrlProblem(v)
  if (imageProblem) return { valid: false, reason: imageProblem }
  const withoutUrls = v.replace(/url\([^)]*\)/gi, '')

  FLOAT_REGEX.lastIndex = 0
  let floatMatch: RegExpExecArray | null
  while ((floatMatch = FLOAT_REGEX.exec(withoutUrls)) !== null) {
    const decimals = floatMatch[1]
    if (decimals!.length > MAX_DECIMAL_PLACES) {
      return { valid: false, reason: { key: 'tooManyDecimals', params: { max: MAX_DECIMAL_PLACES } } }
    }
  }

  const withoutHex = withoutUrls.replace(/#[0-9a-fA-F]{3,8}/gi, '')
  DIMENSION_REGEX.lastIndex = 0
  let dimMatch: RegExpExecArray | null
  while ((dimMatch = DIMENSION_REGEX.exec(withoutHex)) !== null) {
    const unit = dimMatch[2]!.toLowerCase()
    if (isKeywordSuffix(unit)) continue
    if (!ALLOWED_UNITS.includes(unit)) {
      return {
        valid: false,
        reason: { key: 'unitNotAllowed', params: { unit, allowed: ALLOWED_UNITS.join(', ') } },
      }
    }
  }

  return { valid: true }
}

/**
 * Why AO3 would reject an image URL in this value, or null if it has none or they're all fine.
 * AO3 only accepts image URLs whose path ends in jpg, jpeg, png or gif. Shared with the preview,
 * which leaves these declarations out (see applyAo3CssRules).
 */
export function imageUrlProblem(value: string): LintMessage | null {
  URL_REGEX.lastIndex = 0
  let urlMatch: RegExpExecArray | null
  while ((urlMatch = URL_REGEX.exec(value)) !== null) {
    const ext = imageExtension(urlMatch[1]!)
    if (!ext) {
      return { key: 'imageUrlNoExtension', params: { allowed: ALLOWED_IMAGE_FORMATS.join(', ') } }
    }
    if (!ALLOWED_IMAGE_FORMATS.includes(ext)) {
      return { key: 'imageFormatNotAllowed', params: { ext, allowed: ALLOWED_IMAGE_FORMATS.join(', ') } }
    }
  }
  return null
}

// The file extension of a URL's last path segment, e.g. "webp" for ".../glitter.webp?x=1".
// Empty when there isn't one, so a domain like "i.ibb.co" isn't read as an extension.
function imageExtension(href: string): string {
  const path = href.split(/[?#]/)[0] ?? ''
  const lastSegment = path.split('/').pop() ?? ''
  const dot = lastSegment.lastIndexOf('.')
  return dot === -1 ? '' : lastSegment.slice(dot + 1).toLowerCase()
}

function isKeywordSuffix(unit: string): boolean {
  const nonUnits = ['e', 'x']
  return nonUnits.includes(unit)
}
