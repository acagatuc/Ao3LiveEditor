// Applies AO3's work skin rules to CSS before it's shown in the preview, so the preview matches
// what AO3 will actually display. This is the start of strict mode.
//
// - Selectors: AO3 puts "#workskin " in front of every selector that doesn't already start with
//   "#workskin" (clean_css_code in AO3's lib/css_cleaner.rb). That changes specificity:
//   `a:link` becomes `#workskin a:link`, which then beats `#workskin .some-class`.
// - Images: AO3 won't accept image URLs that aren't jpg, jpeg, png or gif, so declarations
//   using them are left out rather than showing an image AO3 never will.
// - Comments are stripped, as AO3 does.

import { imageUrlProblem } from './validateValue'
import { CSS_COMMENT_REGEX } from './cssComments'

const PREFIX = '#workskin'

// At-rules whose blocks hold ordinary rules, which get prefixed too. Other blocks (e.g.
// @keyframes, whose "selectors" are percentages) are left as written.
const GROUPING_AT_RULE = /^@(media|supports)\b/i

export function applyAo3CssRules(css: string): string {
  // AO3 strips comments, and removing them first keeps braces in comments from confusing the scan.
  return prefixRules(css.replace(CSS_COMMENT_REGEX, ''))
}

function prefixRules(css: string): string {
  let out = ''
  let i = 0

  while (i < css.length) {
    const open = indexOutsideStrings(css, '{', i)
    if (open === -1) {
      out += css.slice(i)
      break
    }

    // Anything up to the last ';' before the '{' is a statement at-rule (e.g. @import ...;) or
    // stray text, copied as is. What follows it is this block's selector or at-rule prelude.
    let prelude = css.slice(i, open)
    const lastSemicolon = prelude.lastIndexOf(';')
    if (lastSemicolon !== -1) {
      out += prelude.slice(0, lastSemicolon + 1)
      prelude = prelude.slice(lastSemicolon + 1)
    }

    const end = matchingBrace(css, open)
    const body = css.slice(open + 1, end)
    const leading = prelude.match(/^\s*/)![0]
    const trimmed = prelude.trim()

    if (trimmed.startsWith('@')) {
      out += prelude + '{' + (GROUPING_AT_RULE.test(trimmed) ? prefixRules(body) : body) + '}'
    } else {
      out += leading + prefixSelectorList(trimmed) + ' {' + withoutRejectedDeclarations(body) + '}'
    }
    i = end + 1
  }

  return out
}

// Drops declarations AO3 would reject, keeping the rest of the rule body as written.
function withoutRejectedDeclarations(body: string): string {
  return splitDeclarations(body)
    .filter((declaration) => !imageUrlProblem(declaration))
    .join(';')
}

// Splits a rule body on semicolons that aren't inside quotes or parentheses, so a URL like
// url("a;b.png") stays in one piece.
function splitDeclarations(body: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (ch === '"' || ch === "'") i = closingQuote(body, i)
    else if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === ';' && depth === 0) {
      parts.push(body.slice(start, i))
      start = i + 1
    }
  }
  parts.push(body.slice(start))
  return parts
}

function prefixSelectorList(selectorList: string): string {
  return splitSelectors(selectorList)
    .map((selector) => (selector.startsWith(PREFIX) ? selector : `${PREFIX} ${selector}`))
    .join(', ')
}

// Splits on commas outside parentheses and brackets, e.g. `a, p:is(.x, .y)` gives two selectors.
function splitSelectors(selectorList: string): string[] {
  const selectors: string[] = []
  let depth = 0
  let current = ''
  for (const ch of selectorList) {
    if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    if (ch === ',' && depth === 0) {
      selectors.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  selectors.push(current)
  // AO3 also removes line breaks inside selectors.
  return selectors.map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean)
}

// Index of the '}' closing the block opened at `open`, or the end of the text if it's unclosed.
function matchingBrace(css: string, open: number): number {
  let depth = 0
  for (let i = open; i < css.length; i++) {
    const ch = css[i]
    if (ch === '"' || ch === "'") {
      i = closingQuote(css, i)
    } else if (ch === '{') {
      depth++
    } else if (ch === '}' && --depth === 0) {
      return i
    }
  }
  return css.length
}

function indexOutsideStrings(css: string, target: string, from: number): number {
  for (let i = from; i < css.length; i++) {
    const ch = css[i]
    if (ch === '"' || ch === "'") i = closingQuote(css, i)
    else if (ch === target) return i
  }
  return -1
}

// Index of the quote that closes the string starting at `start`, skipping escaped quotes.
function closingQuote(css: string, start: number): number {
  const quote = css[start]
  for (let i = start + 1; i < css.length; i++) {
    if (css[i] === '\\') i++
    else if (css[i] === quote) return i
  }
  return css.length
}
