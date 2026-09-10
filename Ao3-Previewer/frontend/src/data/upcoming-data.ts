export type UpcomingStatus = 'in-progress' | 'planned'

export interface UpcomingItem {
  status: UpcomingStatus
  description: string
}

// Forward-looking only - once something ships, move it into CHANGELOG instead.
export const UPCOMING: UpcomingItem[] = [
  { status: 'in-progress', description: 'Saved drafts - save your work and pick up where you left off' },
  { status: 'in-progress', description: 'Dark mode / theming' },
  { status: 'planned', description: 'Version history for drafts' },
  { status: 'planned', description: 'AO3 bookmark searcher improvements' },
  { status: 'planned', description: 'Community-submitted workskins' },
  { status: 'planned', description: 'Mobile support' },
  { status: 'planned', description: 'AO3 site skin preview' },
  { status: 'planned', description: 'Export to PDF' },
  { status: 'planned', description: 'Collaborative editing' },
]
