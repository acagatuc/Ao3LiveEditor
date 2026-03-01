import type { CssAnalysis, CssRule, CssDeclaration } from '../utilities/analyzeCss'

/**
 * Rebuilds CSS from analyzed structure.
 *
 * @param analysis
 * Structured result from analyzeCss()
 *
 * @param strictMode
 * - false: Return CSS exactly as analyzed (no stripping)
 * - true: Mimic AO3 behavior (not implemented in state yet)
 *
 * This function NEVER mutates the analysis object.
 */
export function buildPreviewCss(analysis: CssAnalysis, strictMode: boolean): string {
  if (!analysis.rules.length) return ''

  const output: string[] = []

  for (const rule of analysis.rules) {
    const rebuiltRule = rebuildRule(rule, strictMode)

    if (rebuiltRule) {
      output.push(rebuiltRule)
    }
  }

  return output.join('\n\n')
}

/**
 * Rebuilds a single ruleset.
 */
function rebuildRule(rule: CssRule, strictMode: boolean): string | null {
  if (!rule.declarations.length) return null

  let declarations: CssDeclaration[] = rule.declarations

  // STRICT MODE LOGIC
  if (strictMode) {
    // Remove invalid properties
    declarations = declarations.filter((d) => d.valid)

    // Keep only the LAST declaration per property
    // AO3 retains only the final declaration of a duplicate property.
    const lastSeen = new Map<string, CssDeclaration>()

    for (const decl of declarations) {
      lastSeen.set(decl.property, decl)
    }

    declarations = Array.from(lastSeen.values())
  }

  if (!declarations.length) return null

  // Reconstruct rule
  const declarationStrings = declarations.map((d) => `  ${d.property}: ${d.value};`)

  return `${rule.selector} {\n${declarationStrings.join('\n')}\n}`
}
