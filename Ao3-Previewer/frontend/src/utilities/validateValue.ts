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
const DIMENSION_REGEX = /(-?\d+(?:\.\d+)?)\s*([a-z%]+)/gi
const URL_REGEX = /url\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi

export function validateValue(value: string, _property: string): ValueValidationResult {
  if (!value?.trim()) return { valid: false, reason: { key: 'emptyValue' } }

  const v = value.trim()

  if (/\bvar\s*\(/.test(v)) {
    return { valid: false, reason: { key: 'varNotAllowed' } }
  }

  FLOAT_REGEX.lastIndex = 0
  let floatMatch: RegExpExecArray | null
  while ((floatMatch = FLOAT_REGEX.exec(v)) !== null) {
    const decimals = floatMatch[1]
    if (decimals!.length > MAX_DECIMAL_PLACES) {
      return { valid: false, reason: { key: 'tooManyDecimals', params: { max: MAX_DECIMAL_PLACES } } }
    }
  }

  const withoutHex = v.replace(/#[0-9a-fA-F]{3,8}/gi, '')
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

  URL_REGEX.lastIndex = 0
  let urlMatch: RegExpExecArray | null
  while ((urlMatch = URL_REGEX.exec(v)) !== null) {
    const href = urlMatch[1]
    const ext = href!.split('.').pop()?.toLowerCase().split('?')[0] ?? ''
    if (ext && !ALLOWED_IMAGE_FORMATS.includes(ext)) {
      return {
        valid: false,
        reason: {
          key: 'imageFormatNotAllowed',
          params: { ext, allowed: ALLOWED_IMAGE_FORMATS.join(', ') },
        },
      }
    }
  }

  return { valid: true }
}

function isKeywordSuffix(unit: string): boolean {
  const nonUnits = ['e', 'x']
  return nonUnits.includes(unit)
}
