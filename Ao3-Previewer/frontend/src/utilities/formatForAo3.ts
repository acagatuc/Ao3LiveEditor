import * as Sentry from '@sentry/react'

const INLINE_ELEMENTS = new Set([
  'a', 'abbr', 'acronym', 'b', 'bdo', 'big', 'br', 'cite', 'code',
  'dfn', 'em', 'i', 'img', 'input', 'kbd', 'label', 'map', 'object',
  'output', 'q', 's', 'samp', 'select', 'small', 'span', 'strong',
  'sub', 'sup', 'textarea', 'time', 'tt', 'u', 'var',
])

/**
 * Trims whitespace from text nodes and wraps bare text / inline-only runs in <p> tags.
 * Applied by the "Format for AO3" button — modifies editor content explicitly.
 */
export function formatForAo3(html: string): string {
  try {
    if (!html || html.trim() === '') return html

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const body = doc.body

    function processNode(node: Element) {
      const children = Array.from(node.childNodes)
      let inlineGroup: Node[] = []

      function flushGroup() {
        if (inlineGroup.length === 0) return
        if (node.tagName?.toLowerCase() === 'p' || node.tagName?.toLowerCase() === 'summary') {
          inlineGroup = []
          return
        }
        const hasContent = inlineGroup.some(n =>
          n.nodeType === Node.TEXT_NODE
            ? n.textContent?.trim() !== ''
            : true
        )
        if (hasContent) {
          const p = doc.createElement('p')
          inlineGroup.forEach(n => p.appendChild(n.cloneNode(true)))
          node.insertBefore(p, inlineGroup[0])
        }
        inlineGroup.forEach(n => {
          if (n.parentNode === node) node.removeChild(n)
        })
        inlineGroup = []
      }

      children.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent ?? ''
          if (text.trim() !== '') {
            child.textContent = text.trim()
            inlineGroup.push(child)
          } else {
            flushGroup()
            if (text.includes('\n')) {
              child.textContent = '\n'
            } else if (child.parentNode === node) {
              node.removeChild(child)
            }
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as Element
          const tag = el.tagName.toLowerCase()
          if (INLINE_ELEMENTS.has(tag)) {
            inlineGroup.push(child)
          } else {
            flushGroup()
            processNode(el)
          }
        }
      })
      flushGroup()
    }

    processNode(body)
    return body.innerHTML
  } catch (error) {
    Sentry.captureException(error, { extra: { htmlLength: html.length } })
    return html
  }
}
