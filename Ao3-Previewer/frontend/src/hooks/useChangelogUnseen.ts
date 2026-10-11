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

// Compares "0.14.1"-style versions numerically: negative if a is older.
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0)
    if (diff !== 0) return diff
  }
  return 0
}

// Unseen only when the latest release is newer than the last one seen, so a
// tab still running an older build can't bring the dot back.
export function isChangelogUnseen(): boolean {
  const latest = getLatestVersion()
  if (!latest) return false
  const lastSeen = readLastSeenVersion()
  return !lastSeen || compareVersions(latest, lastSeen) > 0
}

export function markChangelogSeen(): void {
  const latest = getLatestVersion()
  if (!latest) return
  // Never move "seen" backwards from an older build.
  const lastSeen = readLastSeenVersion()
  if (lastSeen && compareVersions(latest, lastSeen) <= 0) return
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
