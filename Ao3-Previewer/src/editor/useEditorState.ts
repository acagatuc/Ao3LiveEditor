import { useState, useCallback } from 'react'

const STORAGE_KEY = 'ao3-editor-state'

function readStorage(): { html: string; css: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { html: '', css: '' }
    const parsed = JSON.parse(raw)
    return { html: parsed.html ?? '', css: parsed.css ?? '' }
  } catch {
    return { html: '', css: '' }
  }
}

export function useEditorState() {
  const [html, setHtml] = useState(() => readStorage().html)
  const [css, setCss] = useState(() => readStorage().css)

  const saveToStorage = useCallback((nextHtml: string, nextCss: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ html: nextHtml, css: nextCss }))
  }, [])

  const clear = useCallback(() => {
    setHtml('')
    setCss('')
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { html, setHtml, css, setCss, saveToStorage, clear }
}
