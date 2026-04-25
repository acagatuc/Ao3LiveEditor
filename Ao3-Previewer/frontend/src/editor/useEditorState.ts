import { useState, useCallback } from 'react'

const STORAGE_KEY = 'ao3-editor-state'

function getInitialState(): { html: string; css: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { html: '', css: '' }
    const parsed = JSON.parse(raw)
    return { html: parsed.html || '', css: parsed.css || '' }
  } catch {
    return { html: '', css: '' }
  }
}

export function useEditorState() {
  const [{ html, css }, setState] = useState<{ html: string; css: string }>(getInitialState)

  const setHtml = useCallback((value: string) => {
    setState((prev) => ({ ...prev, html: value }))
  }, [])

  const setCss = useCallback((value: string) => {
    setState((prev) => ({ ...prev, css: value }))
  }, [])

  const saveToStorage = useCallback((currentHtml: string, currentCss: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ html: currentHtml, css: currentCss }))
    } catch (err) {
      console.warn('Failed to save editor state:', err)
    }
  }, [])

  const clear = useCallback(() => {
    setState({ html: '', css: '' })
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ html: '', css: '' }))
    } catch {
      // ignore
    }
  }, [])

  return { html, css, setHtml, setCss, saveToStorage, clear }
}
