import {
  ALLOWED_PREFIXES,
  ALLOWED_PROPERTIES,
  DISALLOWED_AT_RULES,
} from '../allowlist/cssAllowedProperties'

export interface PropertyValidationResult {
  valid: boolean
  reason?: string
}

export function validateProperty(
  rawProperty: string,
  options?: {
    allowCssVariables?: boolean
  },
): PropertyValidationResult {
  if (!rawProperty) return { valid: false, reason: 'Empty property name' }

  const property = rawProperty.trim().toLowerCase()

  if (property.startsWith('@')) {
    if (DISALLOWED_AT_RULES.includes(property)) {
      return { valid: false, reason: `${property} is not allowed by AO3` }
    }
    return { valid: false, reason: 'At-rules are not allowed in work skins' }
  }

  if (property === 'font') {
    return {
      valid: false,
      reason: 'Font shorthand is not allowed; specify font properties individually',
    }
  }

  if (property.startsWith('--')) {
    if (!options?.allowCssVariables) {
      return {
        valid: false,
        reason: 'Custom properties (CSS variables) are only allowed in site skins',
      }
    }
    const validName = /^--[a-z0-9\-_]+$/.test(property)
    if (!validName) return { valid: false, reason: 'Invalid custom property name format' }
    return { valid: true }
  }

  if (ALLOWED_PROPERTIES.has(property)) return { valid: true }

  for (const prefix of ALLOWED_PREFIXES) {
    if (property === prefix) return { valid: true }
    if (property.startsWith(prefix + '-')) return { valid: true }
  }

  return { valid: false, reason: `"${property}" is not in the AO3 allowlist` }
}
