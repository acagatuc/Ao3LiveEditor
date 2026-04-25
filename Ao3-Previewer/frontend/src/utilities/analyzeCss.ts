// Orchestrates parsing and validation to produce a structured representation of the CSS along with aggregated warnings for unsupported properties, duplicates, and disallowed constructs.

import { validateProperty } from './validateProperties'
import { validateValue } from './validateValue'

export interface CssDeclaration {
  property: string
  value: string
  valid: boolean
  reason?: string
}

export interface CssRule {
  selector: string
  declarations: CssDeclaration[]
}

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

export interface CssAnalysis {
  rules: CssRule[]
  warnings: CssWarning[]
}

export function analyzeCss(
  rawCss: string,
  options?: {
    allowCssVariables?: boolean
  },
): CssAnalysis {
  const warnings: CssWarning[] = []
  const rules: CssRule[] = []

  if (!rawCss?.trim()) {
    return { rules: [], warnings: [] }
  }

  const commentRegex = /\/\*[\s\S]*?\*\//g
  if (commentRegex.test(rawCss)) {
    warnings.push({
      type: 'comment-stripped',
      message: 'Comments are stripped by AO3',
    })
  }

  const cssWithoutComments = rawCss.replace(commentRegex, '')
  const ruleRegex = /([^{}]+)\{([^{}]+)\}/g

  for (const match of cssWithoutComments.matchAll(ruleRegex)) {
    const [, untrimmedSelector, body] = match
    if (!untrimmedSelector || !body) continue

    const selector = untrimmedSelector.trim()
    if (selector.startsWith('@')) {
      warnings.push({
        type: 'disallowed-atrule',
        message: `${selector} is not allowed by AO3`,
        selector,
      })
    }

    const seenProperties = new Set<string>()
    const declarations: CssDeclaration[] = []
    const declarationParts = body.split(';')

    for (const part of declarationParts) {
      if (!part.trim()) continue

      const [rawProperty, ...values] = part.split(':')
      if (!rawProperty || values.length === 0) continue

      const property = rawProperty.trim()
      const value = values.join(':').trim()

      const validation = validateProperty(property, {
        allowCssVariables: options?.allowCssVariables,
      })

      const normalizedProperty = property.toLowerCase()
      if (seenProperties.has(normalizedProperty)) {
        warnings.push({
          type: 'duplicate-property',
          message: `Duplicate declaration for "${normalizedProperty}"! AO3 keeps only the last one!`,
          selector,
          property: normalizedProperty,
        })
      }

      seenProperties.add(normalizedProperty)

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

    rules.push({ selector, declarations })
  }

  return { rules, warnings }
}
