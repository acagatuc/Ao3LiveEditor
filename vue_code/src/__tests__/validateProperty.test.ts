import { describe, it, expect } from 'vitest'
import { validateProperty } from '../utilities/validateProperties'

describe('validateProperty – explicit allowlist', () => {
  it('allows exact match properties', () => {
    expect(validateProperty('color').valid).toBe(true)
    expect(validateProperty('position').valid).toBe(true)
    expect(validateProperty('z-index').valid).toBe(true)
  })
})

describe('validateProperty – prefix rules', () => {
  it('allows prefixed properties', () => {
    expect(validateProperty('margin-top').valid).toBe(true)
    expect(validateProperty('background-color').valid).toBe(true)
    expect(validateProperty('border-left-width').valid).toBe(true)
  })
})

describe('validateProperty – invalid properties', () => {
  it('rejects unknown properties', () => {
    const result = validateProperty('banana')

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('not in the AO3 allowlist')
  })
})

describe('validateProperty – font shorthand', () => {
  it('rejects font shorthand', () => {
    const result = validateProperty('font')

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Font shorthand is not allowed')
  })
})

describe('validateProperty – at-rules', () => {
  it('rejects disallowed at-rules', () => {
    const result = validateProperty('@font-face')

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('not allowed')
  })
})

describe('validateProperty – CSS variables', () => {
  it('rejects variables when not allowed', () => {
    const result = validateProperty('--main-color')

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Custom properties')
  })

  it('allows variables when enabled', () => {
    const result = validateProperty('--main-color', {
      allowCssVariables: true,
    })

    expect(result.valid).toBe(true)
  })
})

describe('validateProperty – normalization', () => {
  it('is case insensitive', () => {
    expect(validateProperty('COLOR').valid).toBe(true)
    expect(validateProperty('Margin-Top').valid).toBe(true)
  })
})
