import { ref } from 'vue'
import { renderPreview } from './previewRenderer'

const STORAGE_KEY = 'ao3-editor-state'

export function useEditorState() {
  const html = ref('')
  const css = ref('')

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw)
      html.value = parsed.html || ''
      css.value = parsed.css || ''
    } catch (err) {
      console.warn('Failed to load editor state:', err)
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          html: html.value,
          css: css.value,
        }),
      )
    } catch (err) {
      console.warn('Failed to save editor state:', err)
    }
  }

  function getPreviewDocument() {
    return renderPreview(html.value, css.value)
  }

  function clear() {
    html.value = ''
    css.value = ''
    saveToStorage()
  }

  return {
    html,
    css,
    loadFromStorage,
    saveToStorage,
    getPreviewDocument,
    clear,
  }
}
