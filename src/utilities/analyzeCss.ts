// Orchestrates parsing and validation to produce a structured representation of the CSS along with aggregated warnings for unsupported properties, duplicates, and disallowed constructs.

import { validateProperty } from './validateProperties'
import { validateValue } from './validateValue'

/**
 * Represents a single CSS declaration inside a ruleset.
 */
export interface CssDeclaration {
  property: string
  value: string
  valid: boolean
  reason?: string
}

/**
 * Represents one CSS ruleset: selector { declarations }
 */
export interface CssRule {
  selector: string
  declarations: CssDeclaration[]
}

/**
 * Represents a non-blocking warning generated during analysis.
 */
export interface CssWarning {
  type:
    | 'invalid-property'
    | 'duplicate-property'
    | 'disallowed-atrule'
    | 'comment-stripped'
    | 'invalid-var-usage'
    | 'value-invalid'
  message: string
  selector?: string
  property?: string
}

/**
 * Final structured output of CSS analysis.
 */
export interface CssAnalysis {
  rules: CssRule[]
  warnings: CssWarning[]
}

/**
 * Parses and analyzes raw CSS input according to AO3 rules.
 *
 * @param rawCss: Full CSS string entered by the user
 * @param options: Context-sensitive configuration for validation.
 * @returns CssAnalysis: Structured representation of rules and warnings.
 */
export function analyzeCss(
  rawCss: string,
  options?: {
    allowCssVariables?: boolean
  },
): CssAnalysis {
  const warnings: CssWarning[] = []
  const rules: CssRule[] = []

  // If there is no CSS inputted.
  if (!rawCss?.trim()) {
    return { rules: [], warnings: [] }
  }

  // Regex to match user comments (comments are stripped from AO3 workskins) (consider keeping them?)
  const commentRegex = /\/\*[\s\S]*?\*\//g
  if (commentRegex.test(rawCss)) {
    warnings.push({
      type: 'comment-stripped',
      message: 'Comments are stripped by AO3',
    })
  }

  // Parses the CSS without comments
  const cssWithoutComments = rawCss.replace(commentRegex, '')

  // Regex to match CSS rules for validation
  const ruleRegex = /([^{}]+)\{([^{}]+)\}/g

  // For each match found in the uncommented CSS
  for (const match of cssWithoutComments.matchAll(ruleRegex)) {
    // Array-like object that exec returns: RegExpExecArray
    // Explicit guard
    const [, untrimmedSelector, body] = match

    // If the selector or body doesn't exist
    if (!untrimmedSelector || !body) continue

    const selector = untrimmedSelector.trim()
    if (selector.startsWith('@')) {
      warnings.push({
        type: 'disallowed-atrule',
        message: `${selector} is not allowed by AO3`,
        selector,
      })
    }
    // A set to track already seen properties, so that duplicate properties can be overwritten with the last declaration.
    // As per AO3 rules on multiple declarations in one ruleset.
    const seenProperties = new Set<string>()

    // Stores parsed CSS for a single selector block.
    const declarations: CssDeclaration[] = []

    // The list of unparsed declaration strings that will be procesed into properties.
    const declarationParts = body.split(';')

    // For each CSS declaration
    for (const part of declarationParts) {
      if (!part.trim()) continue

      // Splits the part into selector and values
      const [rawProperty, ...values] = part.split(':')
      if (!rawProperty || values.length === 0) continue

      const property = rawProperty.trim()
      // Rejoins the values as long as the property remains separate
      const value = values.join(':').trim()

      const validation = validateProperty(property, {
        allowCssVariables: options?.allowCssVariables,
      })

      const normalizedProperty = property.toLowerCase()
      // If the set as the property, add a warning
      if (seenProperties.has(normalizedProperty)) {
        warnings.push({
          type: 'duplicate-property',
          message: `Duplicate declaration for "${normalizedProperty}"! AO3 keeps only the last one!`,
          selector,
          property: normalizedProperty,
        })
      }

      seenProperties.add(normalizedProperty)

      // var() is only available in site skins, which is not what this website is capable of doing yet
      if (value.includes('var(')) {
        const fallbackPattern = /var\([^,]+,[^)]+\)/
        if (fallbackPattern.test(value)) {
          warnings.push({
            type: 'invalid-var-usage',
            message: 'var() fallbacks are not allowed by AO3',
            selector,
            property: normalizedProperty,
          })
        }
      }

      if (!validation.valid) {
        warnings.push({
          type: 'invalid-property',
          message: validation.reason || 'Invalid property',
          selector,
          property: normalizedProperty,
        })
      } else {
        // Only validate the value if the property itself is allowed
        const valueValidation = validateValue(value, normalizedProperty)
        if (!valueValidation.valid) {
          warnings.push({
            type: 'value-invalid',
            message: valueValidation.reason || 'Invalid value',
            selector,
            property: normalizedProperty,
          })
        }
      }

      declarations.push({
        property: normalizedProperty,
        value,
        valid: validation.valid,
        reason: validation.reason,
      })
    }

    rules.push({
      selector,
      declarations,
    })
  }

  return {
    rules,
    warnings,
  }
}
