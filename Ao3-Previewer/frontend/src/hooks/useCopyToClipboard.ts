import { useEffect, useRef, useState } from 'react'

export type CopyState = 'idle' | 'copied' | 'failed'

const COPIED_RESET_MS = 2000
// Long enough to read the message and select the text by hand instead.
const FAILED_RESET_MS = 4000

// Copies text and reports how it went, so a copy button can say "Copied!" or
// admit the browser blocked clipboard access (older Safari, in-app browsers,
// privacy settings) instead of silently doing nothing.
export function useCopyToClipboard() {
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  async function copy(text: string) {
    clearTimeout(resetTimer.current)
    let next: CopyState
    try {
      await navigator.clipboard.writeText(text)
      next = 'copied'
    } catch {
      next = 'failed'
    }
    setCopyState(next)
    resetTimer.current = setTimeout(
      () => setCopyState('idle'),
      next === 'copied' ? COPIED_RESET_MS : FAILED_RESET_MS,
    )
  }

  function reset() {
    clearTimeout(resetTimer.current)
    setCopyState('idle')
  }

  return { copyState, copy, reset }
}
