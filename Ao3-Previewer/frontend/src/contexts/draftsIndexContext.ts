import { createContext, useContext } from 'react'
import type { UseDraftsIndexReturn } from '../hooks/useDraftsIndex'

export const DraftsIndexContext = createContext<UseDraftsIndexReturn | null>(null)

export function useDraftsIndexContext(): UseDraftsIndexReturn {
  const ctx = useContext(DraftsIndexContext)
  if (!ctx) throw new Error('useDraftsIndexContext must be used within a DraftsIndexProvider')
  return ctx
}
