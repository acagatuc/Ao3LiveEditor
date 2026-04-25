export function sanitizeHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const ALLOWED_TAGS = new Set([
    'a','abbr','acronym','address','b','big','blockquote','br','caption','center','cite',
    'code','col','colgroup','dd','del','details','dfn','div','dl','dt','em','figcaption','figure',
    'h1','h2','h3','h4','h5','h6','hr','i','img','ins','kbd','li','ol','p','pre','q','ruby','rt','rp',
    's','samp','small','span','strike','strong','sub','summary','sup','table','tbody','td','tfoot','th',
    'thead','tr','tt','u','ul','var'
  ])

  const ALLOWED_ATTRS = new Set([
    'align','alt','axis','class','height','href','name','src','title','width'
  ])

  function sanitizeNode(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      const tag = el.tagName.toLowerCase()

      // ❌ Remove entire subtree if tag is not allowed
      if (!ALLOWED_TAGS.has(tag)) {
        el.remove()
        return
      }

      // ✅ Clean attributes
      Array.from(el.attributes).forEach(attr => {
        if (!ALLOWED_ATTRS.has(attr.name.toLowerCase())) {
          el.removeAttribute(attr.name)
        }
      })

      // Strip javascript: URLs from href/src to prevent sandbox blocks
      for (const attr of ['href', 'src']) {
        const val = el.getAttribute(attr)
        if (val && /^\s*javascript:/i.test(val)) {
          el.removeAttribute(attr)
        }
      }
    }

    // Recurse safely (use Array.from to avoid live NodeList issues)
    Array.from(node.childNodes).forEach(sanitizeNode)
  }

  Array.from(doc.body.childNodes).forEach(sanitizeNode)

  return doc.body.innerHTML
}