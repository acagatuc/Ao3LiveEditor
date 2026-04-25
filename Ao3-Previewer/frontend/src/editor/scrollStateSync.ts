// Module-level mutable scroll coordination — no React state needed.
// EditorInput dispatches editor-scroll events; PreviewFrame listens and syncs.

export const scrollSync = {
  isSyncing: false,
}

export function emitEditorScroll(ratio: number): void {
  window.dispatchEvent(new CustomEvent('ao3:editor-scroll', { detail: ratio }))
}

export function onEditorScroll(cb: (ratio: number) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<number>).detail)
  window.addEventListener('ao3:editor-scroll', handler)
  return () => window.removeEventListener('ao3:editor-scroll', handler)
}
