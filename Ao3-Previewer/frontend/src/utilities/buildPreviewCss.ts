import type { CssAnalysis, CssRule, CssDeclaration } from './analyzeCss'

export function buildPreviewCss(analysis: CssAnalysis, strictMode: boolean): string {
  if (!analysis.rules.length) return ''

  const output: string[] = []
  for (const rule of analysis.rules) {
    const rebuiltRule = rebuildRule(rule, strictMode)
    if (rebuiltRule) output.push(rebuiltRule)
  }
  return output.join('\n\n')
}

function rebuildRule(rule: CssRule, strictMode: boolean): string | null {
  if (!rule.declarations.length) return null

  let declarations: CssDeclaration[] = rule.declarations

  if (strictMode) {
    declarations = declarations.filter((d) => d.valid)
    const lastSeen = new Map<string, CssDeclaration>()
    for (const decl of declarations) lastSeen.set(decl.property, decl)
    declarations = Array.from(lastSeen.values())
  }

  if (!declarations.length) return null

  const declarationStrings = declarations.map((d) => `  ${d.property}: ${d.value};`)
  return `${rule.selector} {\n${declarationStrings.join('\n')}\n}`
}
