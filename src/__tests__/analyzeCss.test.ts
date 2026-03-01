import { describe, it, expect } from 'vitest'

import { analyzeCss, type CssRule } from '../utilities/analyzeCss'
import { buildPreviewCss } from '../utilities/buildPreviewCss'

describe('AO3 allowed properties', () => {
  it('keeps valid properties in strict mode', () => {
    const input = `
      .box {
        margin: 10px;
        padding: 5px;
        background: red;
      }
    `

    const analysis = analyzeCss(input)
    const output = buildPreviewCss(analysis, true)

    expect(output).toContain('margin: 10px;')
    expect(output).toContain('padding: 5px;')
    expect(output).toContain('background: red;')
  })
})

describe('analyzeCss – disallowed at-rules', () => {
  it('flags @font-face as disallowed', () => {
    const input = `
      @font-face {
        font-family: "BadFont";
        src: url("bad.ttf");
      }

      .box {
        margin: 10px;
      }
    `

    const analysis = analyzeCss(input)

    // Ensure warning exists
    const atRuleWarning = analysis.warnings.find((w) => w.type === 'disallowed-atrule')

    expect(atRuleWarning).toBeDefined()
    expect(atRuleWarning?.message).toContain('@font-face')

    // Ensure normal rules still parsed
    const boxRule = analysis.rules.find((r) => r.selector.trim() === '.box') as CssRule
    expect(boxRule).toBeDefined()
    expect(boxRule?.declarations?.[0]?.property).toBe('margin')
  })
})

describe('duplicate property handling', () => {
  it('keeps only the last duplicate', () => {
    const input = `
      .box {
        margin: 5px;
        margin: 10px;
      }
    `

    const analysis = analyzeCss(input)
    const output = buildPreviewCss(analysis, true)

    // Ensure warning exists
    const duplicateWarning = analysis.warnings.find((w) => w.type === 'duplicate-property')

    expect(duplicateWarning).toBeDefined()
    expect(duplicateWarning?.message).toContain(
      'Duplicate declaration for "margin"! AO3 keeps only the last one!',
    )

    expect(output).not.toContain('margin: 5px;')
    expect(output).toContain('margin: 10px;')
  })

  it('keeps duplicates in non-strict mode', () => {
    const input = `
      .box {
        margin: 5px;
        margin: 10px;
      }
    `

    const analysis = analyzeCss(input)
    const output = buildPreviewCss(analysis, false)

    expect(output).toContain('margin: 5px;')
    expect(output).toContain('margin: 10px;')
  })
})

describe('invalid property names', () => {
  it('warns unknown properties', () => {
    const input = `
      .box {
        banana: yellow;
        padding: 5px;
      }
    `

    const analysis = analyzeCss(input)
    const output = buildPreviewCss(analysis, true)

    const invalidPropertyWarning = analysis.warnings.find((w) => w.type === 'invalid-property')

    expect(invalidPropertyWarning).toBeDefined()
    expect(invalidPropertyWarning?.message).toContain('"banana" is not in the AO3 allowlist')

    expect(output).not.toContain('banana:')
    expect(output).toContain('padding: 5px;')
  })
})

describe('invalid var() usage', () => {
  it('warns var() fallbacks', () => {
    const input = `
      .box {
        padding: var(--main-padding, 5px);
      }
    `

    const analysis = analyzeCss(input)
    const output = buildPreviewCss(analysis, true)

    const invalidVar = analysis.warnings.find((w) => w.type === 'invalid-var-usage')

    expect(invalidVar).toBeDefined()
    expect(invalidVar?.message).toContain('var() fallbacks are not allowed by AO3')

    expect(output).not.toContain('padding: 5px;')
  })
})

describe('shorthand support', () => {
  it('allows border shorthand', () => {
    const input = `
      .box {
        border: 1px solid black;
      }
    `

    const analysis = analyzeCss(input)
    const output = buildPreviewCss(analysis, true)

    expect(output).toContain('border: 1px solid black;')
  })
})
