import { useState, useCallback } from 'react'
import type { DraftPayloadType } from '../api/drafts'

const STORAGE_KEY = 'ao3-drafts-index'

export interface DraftIndexEntry {
  id: string
  title: string
  updatedAt: string
  payloadType: DraftPayloadType
}

function readIndex(): DraftIndexEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeIndex(entries: DraftIndexEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch (err) {
    console.warn('Failed to save drafts index:', err)
  }
}

function sortByUpdatedAtDesc(entries: DraftIndexEntry[]): DraftIndexEntry[] {
  return [...entries].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function useDraftsIndex() {
  const [entries, setEntries] = useState<DraftIndexEntry[]>(() => sortByUpdatedAtDesc(readIndex()))

  const upsert = useCallback((entry: DraftIndexEntry) => {
    setEntries((prev) => {
      const next = sortByUpdatedAtDesc([entry, ...prev.filter((e) => e.id !== entry.id)])
      writeIndex(next)
      return next
    })
  }, [])

  const remove = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id)
      writeIndex(next)
      return next
    })
  }, [])

  return { entries, upsert, remove }
}

export type UseDraftsIndexReturn = ReturnType<typeof useDraftsIndex>
