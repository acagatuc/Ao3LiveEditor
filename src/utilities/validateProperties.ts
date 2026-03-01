// Normalizes and checks a single CSS property name against the AO3 allowlist and prefix rules, returning whether it is permitted and why if not.
import {
  ALLOWED_PREFIXES,
  ALLOWED_PROPERTIES,
  DISALLOWED_AT_RULES,
} from '../allowlist/cssAllowedProperties'

/**
 * Type that defines whether the property is valid, and includes a reason if it isn't for error messages.
 */
export interface PropertyValidationResult {
  valid: boolean
  reason?: string
}

/**
 * Validates a CSS property name against AO3 rules.
 * This does NOT validate the value - only the property itself.
 *
 * @param rawProperty: Property name to check
 * @param options: Options regarding site skins (for later)
 */
export function validateProperty(
  rawProperty: string,
  options?: {
    allowCssVariables?: boolean
  },
): PropertyValidationResult {
  if (!rawProperty) {
    return { valid: false, reason: 'Empty property name' }
  }

  const property = rawProperty.trim().toLowerCase()

  // Block at-rules used as properties
  if (property.startsWith('@')) {
    if (DISALLOWED_AT_RULES.includes(property)) {
      return { valid: false, reason: `${property} is not allowed by AO3` }
    }

    return { valid: false, reason: 'At-rules are not allowed in work skins' }
  }

  // Block font property explicitly
  if (property === 'font') {
    return {
      valid: false,
      reason: 'Font shorthand is not allowed; specify font properties individually',
    }
  }

  // Handle CSS custom properties for site skins
  if (property.startsWith('--')) {
    if (!options?.allowCssVariables) {
      return {
        valid: false,
        reason: 'Custom properties (CSS variables) are only allowed in site skins',
      }
    }

    // Validate variable name format:
    const validName = /^--[a-z0-9\-_]+$/.test(property)

    if (!validName) {
      return {
        valid: false,
        reason: 'Invalid custom property name format',
      }
    }

    return { valid: true }
  }

  // Explicit allowlist match
  if (ALLOWED_PROPERTIES.has(property)) {
    return { valid: true }
  }

  // Prefix match (covers shorthand + variations)
  for (const prefix of ALLOWED_PREFIXES) {
    if (property === prefix) {
      return { valid: true }
    }

    if (property.startsWith(prefix + '-')) {
      return { valid: true }
    }
  }

  // Otherwise invalid
  return {
    valid: false,
    reason: `"${property}" is not in the AO3 allowlist`,
  }
}
