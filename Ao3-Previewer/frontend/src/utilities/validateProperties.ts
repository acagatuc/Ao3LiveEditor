import {
  ALLOWED_PREFIXES,
  ALLOWED_PROPERTIES,
  DISALLOWED_AT_RULES,
} from '../allowlist/cssAllowedProperties'
import type { LintMessage } from './lintMessage'

export interface PropertyValidationResult {
  valid: boolean
  reason?: LintMessage
}

export function validateProperty(
  rawProperty: string,
  options?: {
    allowCssVariables?: boolean
  },
): PropertyValidationResult {
  if (!rawProperty) return { valid: false, reason: { key: 'emptyProperty' } }

  const property = rawProperty.trim().toLowerCase()

  if (property.startsWith('@')) {
    if (DISALLOWED_AT_RULES.includes(property)) {
      return { valid: false, reason: { key: 'notAllowedByAo3', params: { name: property } } }
    }
    return { valid: false, reason: { key: 'atRule' } }
  }

  if (property === 'font') {
    return {
      valid: false,
      reason: { key: 'fontShorthand' },
    }
  }

  if (property.startsWith('--')) {
    if (!options?.allowCssVariables) {
      return {
        valid: false,
        reason: { key: 'customPropertyNotAllowed' },
      }
    }
    const validName = /^--[a-z0-9\-_]+$/.test(property)
    if (!validName) return { valid: false, reason: { key: 'customPropertyName' } }
    return { valid: true }
  }

  if (ALLOWED_PROPERTIES.has(property)) return { valid: true }

  for (const prefix of ALLOWED_PREFIXES) {
    if (property === prefix) return { valid: true }
    if (property.startsWith(prefix + '-')) return { valid: true }
  }

  return { valid: false, reason: { key: 'notInAllowlist', params: { property } } }
}
