// Orchestrates parsing and validation to produce a structured representation of the CSS along with aggregated warnings for unsupported properties, duplicates, and disallowed constructs.

import { validateProperty } from './validateProperties'
import { validateValue } from './validateValue'
import { CSS_COMMENT_REGEX } from './cssComments'
import type { LintMessage } from './lintMessage'

export interface CssDeclaration {
  property: string
  value: string
  valid: boolean
  reason?: LintMessage
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
  message: LintMessage
  selector?: string
  property?: string
  // Where the problem is in the CSS: character offsets [start, end) and the 1-based line it
  // starts on. The lint overlay underlines exactly this text.
  start: number
  end: number
  line: number
}

// Warnings that make AO3 refuse to save the skin. AO3 handles the others silently: it strips
// comments and keeps only the last of a duplicated property.
const SAVE_BLOCKING_TYPES = new Set<CssWarning['type']>([
  'invalid-property',
  'value-invalid',
  'disallowed-atrule',
  'invalid-var-usage',
])

export function blocksAo3Save(warning: CssWarning): boolean {
  return SAVE_BLOCKING_TYPES.has(warning.type)
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

  const at = (start: number, end: number) => ({ start, end, line: lineAt(rawCss, start) })

  // One warning per comment, covering the whole comment, so one that runs on past where the
  // author meant it to end is easy to spot.
  for (const match of rawCss.matchAll(CSS_COMMENT_REGEX)) {
    warnings.push({
      type: 'comment-stripped',
      message: { key: 'commentStripped' },
      ...at(match.index, match.index + match[0].length),
    })
  }

  // Comments are blanked out rather than removed, so offsets into this text are offsets into
  // rawCss too.
  const cssWithoutComments = rawCss.replace(CSS_COMMENT_REGEX, (comment) =>
    comment.replace(/[^\n]/g, ' '),
  )
  const ruleRegex = /([^{}]+)\{([^{}]+)\}/g

  for (const match of cssWithoutComments.matchAll(ruleRegex)) {
    const [, untrimmedSelector, body] = match
    if (!untrimmedSelector || !body) continue

    const selector = untrimmedSelector.trim()
    const selectorStart = match.index + leadingSpace(untrimmedSelector)
    if (selector.startsWith('@')) {
      warnings.push({
        type: 'disallowed-atrule',
        message: { key: 'notAllowedByAo3', params: { name: selector } },
        selector,
        ...at(selectorStart, selectorStart + selector.length),
      })
    }

    const seenProperties = new Set<string>()
    const declarations: CssDeclaration[] = []
    let partStart = match.index + untrimmedSelector.length + 1

    for (const part of body.split(';')) {
      const declarationStart = partStart + leadingSpace(part)
      const declarationAt = at(declarationStart, declarationStart + part.trim().length)
      partStart += part.length + 1
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
          message: { key: 'duplicateDeclaration', params: { property: normalizedProperty } },
          selector,
          property: normalizedProperty,
          ...declarationAt,
        })
      }

      seenProperties.add(normalizedProperty)

      if (value.includes('var(')) {
        const fallbackPattern = /var\([^,]+,[^)]+\)/
        if (fallbackPattern.test(value)) {
          warnings.push({
            type: 'invalid-var-usage',
            message: { key: 'varFallback' },
            selector,
            property: normalizedProperty,
            ...declarationAt,
          })
        }
      }

      if (!validation.valid) {
        warnings.push({
          type: 'invalid-property',
          message: validation.reason ?? { key: 'invalidProperty' },
          selector,
          property: normalizedProperty,
          ...declarationAt,
        })
      } else {
        const valueValidation = validateValue(value, normalizedProperty)
        if (!valueValidation.valid) {
          warnings.push({
            type: 'value-invalid',
            message: valueValidation.reason ?? { key: 'invalidValue' },
            selector,
            property: normalizedProperty,
            ...declarationAt,
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

// 1-based line number of the character at `index`.
function lineAt(text: string, index: number): number {
  let line = 1
  for (let i = 0; i < index; i++) {
    if (text[i] === '\n') line++
  }
  return line
}

function leadingSpace(text: string): number {
  return text.length - text.trimStart().length
}
