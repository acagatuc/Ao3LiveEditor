import * as Sentry from '@sentry/react'

const INLINE_ELEMENTS = new Set([
  'a', 'abbr', 'acronym', 'b', 'bdo', 'big', 'br', 'cite', 'code',
  'dfn', 'em', 'i', 'img', 'input', 'kbd', 'label', 'map', 'object',
  'output', 'q', 's', 'samp', 'select', 'small', 'span', 'strong',
  'sub', 'sup', 'textarea', 'time', 'tt', 'u', 'var',
])

/** Mirrors AO3's paragraph-wrapping render behavior. Used by the preview. */
export function normalizeForAo3(html: string): string {
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
        if (node.tagName?.toLowerCase() === 'p') {
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
          if (child.textContent?.trim() !== '') {
            inlineGroup.push(child)
          } else {
            flushGroup()
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

