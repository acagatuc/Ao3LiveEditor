import {
  AO3_ALLOWED_TAGS,
  AO3_GLOBAL_ATTRS,
  AO3_ATTRS_BY_TAG,
  AO3_REMOVE_CONTENTS,
  AO3_URL_PROTOCOLS,
  AO3_CLASS_NAME,
} from '../allowlist/ao3HtmlAllowlist'

const ALLOWED_TAGS = new Set(AO3_ALLOWED_TAGS)
const REMOVE_CONTENTS = new Set(AO3_REMOVE_CONTENTS)

function isAllowedAttr(tag: string, attr: string): boolean {
  return AO3_GLOBAL_ATTRS.includes(attr) || !!AO3_ATTRS_BY_TAG[tag]?.includes(attr)
}

function hasAllowedProtocol(url: string, protocols: string[]): boolean {
  const match = url.trim().match(/^([a-z][a-z0-9+.-]*):/i)
  if (!match) return protocols.includes('relative')
  return protocols.includes(match[1]!.toLowerCase())
}

/** Mirrors AO3's HTML sanitizer so the preview shows what AO3 will keep. */
export function sanitizeHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  function sanitizeNode(node: Node) {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.parentNode?.removeChild(node)
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return

    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()

    if (REMOVE_CONTENTS.has(tag)) {
      el.remove()
      return
    }

    // Sanitize children first so an unwrapped element hands over already-clean content.
    Array.from(el.childNodes).forEach(sanitizeNode)

    if (!ALLOWED_TAGS.has(tag)) {
      // AO3 drops the tag but keeps what's inside it.
      el.replaceWith(...Array.from(el.childNodes))
      return
    }

    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase()
      const protocols = AO3_URL_PROTOCOLS[tag]?.[name]
      if (!isAllowedAttr(tag, name) || (protocols && !hasAllowedProtocol(attr.value, protocols))) {
        el.removeAttribute(attr.name)
      }
    })

    const classes = el.getAttribute('class')
    if (classes !== null) {
      const valid = classes.split(/\s+/).filter((c) => AO3_CLASS_NAME.test(c))
      if (valid.length) el.setAttribute('class', valid.join(' '))
      else el.removeAttribute('class')
    }
  }

  Array.from(doc.body.childNodes).forEach(sanitizeNode)
  return doc.body.innerHTML
}
