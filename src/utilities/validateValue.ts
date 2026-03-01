// This will be where value validation logic lives. (decimal places, units, etc.)
// no var(), no disallowed units, max 2 decimal places on floats,
// and image URLs only use allowed formats.

import {
  ALLOWED_UNITS,
  ALLOWED_IMAGE_FORMATS,
  MAX_DECIMAL_PLACES,
} from '../allowlist/cssAllowedProperties'

export interface ValueValidationResult {
  valid: boolean
  reason?: string
}

// Matches any number literal with a decimal point: e.g. 1.333, 0.5, 12.1234
const FLOAT_REGEX = /\d+\.(\d+)/g

// Matches a CSS dimension: number immediately followed by a unit, e.g. 12px, 1.5em
// Captures: [full, digits, decimals-or-undefined, unit]
const DIMENSION_REGEX = /(-?\d+(?:\.\d+)?)\s*([a-z%]+)/gi

// Matches url(...) with optional quotes
const URL_REGEX = /url\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi

/**
 * Validates a CSS value string against AO3 rules.
 *
 * @param value   The raw value string (right-hand side of the declaration)
 * @param property The property name, used for context in error messages
 */
export function validateValue(value: string, property: string): ValueValidationResult {
  if (!value?.trim()) {
    return { valid: false, reason: 'Empty value' }
  }

  const v = value.trim()

  // 1. No var()
  if (/\bvar\s*\(/.test(v)) {
    return {
      valid: false,
      reason: `var() is not allowed in work skin values`,
    }
  }

  // 2. Float precision
  // max 2 decimal places
  // Reset lastIndex since we use the global flag
  FLOAT_REGEX.lastIndex = 0
  let floatMatch: RegExpExecArray | null
  while ((floatMatch = FLOAT_REGEX.exec(v)) !== null) {
    const decimals = floatMatch[1]
    if (decimals.length > MAX_DECIMAL_PLACES) {
      return {
        valid: false,
        reason: `"AO3 allows 2 decimal places at most!"`,
      }
    }
  }

  // 3. Unit validation
  // Only check tokens that look like CSS dimensions (number + letters/%)
  // Skip pure keywords like 'solid', 'auto', color names, etc.
  DIMENSION_REGEX.lastIndex = 0
  let dimMatch: RegExpExecArray | null
  while ((dimMatch = DIMENSION_REGEX.exec(v)) !== null) {
    const unit = dimMatch[2].toLowerCase()

    // Skip known non-unit suffixes that appear in values (hex colors won't
    // match this regex since they start with #, but guard anyway)
    if (isKeywordSuffix(unit)) continue

    if (!ALLOWED_UNITS.includes(unit)) {
      return {
        valid: false,
        reason: `Unit "${unit}" is not allowed by AO3; allowed units are: ${ALLOWED_UNITS.join(', ')}`,
      }
    }
  }

  // 4. Image URL format
  URL_REGEX.lastIndex = 0
  let urlMatch: RegExpExecArray | null
  while ((urlMatch = URL_REGEX.exec(v)) !== null) {
    const href = urlMatch[1]
    const ext = href.split('.').pop()?.toLowerCase().split('?')[0] ?? ''
    if (ext && !ALLOWED_IMAGE_FORMATS.includes(ext)) {
      return {
        valid: false,
        reason: `Image format ".${ext}" is not allowed; allowed formats are: ${ALLOWED_IMAGE_FORMATS.join(', ')}`,
      }
    }
  }

  return { valid: true }
}

/**
 * Returns true for strings that look like units in the regex but are actually
 * CSS keywords or color function names that follow a number, e.g.:
 *   - "s" or "ms" in transition values like "0.3s"
 *   - "deg", "rad", "turn" in transform/gradient values
 *   - "fr" in grid (not AO3 allowed but handled by unit check above)
 * We let the unit allowlist handle rejection; this just prevents false
 * positives on things that are definitely not CSS length units.
 */
function isKeywordSuffix(unit: string): boolean {
  // These are valid CSS units not in AO3's list but also not "invalid" per se —
  // let the allowlist check handle them. Return false so they go through validation.
  // Only skip things that are definitely not units at all.
  const nonUnits = ['e', 'x'] // e.g. "1e5" scientific notation, stray letters
  return nonUnits.includes(unit)
}
