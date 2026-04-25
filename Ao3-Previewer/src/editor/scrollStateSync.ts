import { createContext, useContext } from 'react'

export interface ScrollState {
  editorScrollRatio: number
  setEditorScrollRatio: (ratio: number) => void
  previewScrollRatio: number
  setPreviewScrollRatio: (ratio: number) => void
  isSyncingScroll: React.MutableRefObject<boolean>
}

export const ScrollStateContext = createContext<ScrollState | null>(null)

export function useScrollState(): ScrollState {
  const ctx = useContext(ScrollStateContext)
  if (!ctx) throw new Error('useScrollState must be used within ScrollStateProvider')
  return ctx
}
