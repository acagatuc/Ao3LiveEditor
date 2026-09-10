import type { ReactNode } from 'react'
import { useDraftsIndex } from '../hooks/useDraftsIndex'
import { DraftsIndexContext } from './draftsIndexContext'

export function DraftsIndexProvider({ children }: { children: ReactNode }) {
  const value = useDraftsIndex()
  return <DraftsIndexContext.Provider value={value}>{children}</DraftsIndexContext.Provider>
}
