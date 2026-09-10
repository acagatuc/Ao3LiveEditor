import { useEffect, useState } from 'react'
import { CHANGELOG } from '../data/changelog-data'

const STORAGE_KEY = 'ao3-changelog-last-seen'
const SEEN_EVENT = 'ao3-changelog-seen'

function readLastSeenVersion(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function getLatestVersion(): string | undefined {
  return CHANGELOG[0]?.version
}

export function isChangelogUnseen(): boolean {
  const latest = getLatestVersion()
  return !!latest && readLastSeenVersion() !== latest
}

export function markChangelogSeen(): void {
  const latest = getLatestVersion()
  if (!latest) return
  try {
    localStorage.setItem(STORAGE_KEY, latest)
  } catch (err) {
    console.warn('Failed to save changelog seen state:', err)
  }
  window.dispatchEvent(new Event(SEEN_EVENT))
}

export function useChangelogUnseen(): boolean {
  const [unseen, setUnseen] = useState(isChangelogUnseen)

  useEffect(() => {
    const recompute = () => setUnseen(isChangelogUnseen())
    window.addEventListener('storage', recompute)
    window.addEventListener(SEEN_EVENT, recompute)
    return () => {
      window.removeEventListener('storage', recompute)
      window.removeEventListener(SEEN_EVENT, recompute)
    }
  }, [])

  return unseen
}
