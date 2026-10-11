export type UpcomingStatus = 'in-progress' | 'planned'

export interface UpcomingItem {
  status: UpcomingStatus
  description: string
}

// Forward-looking only - once something ships, move it into CHANGELOG instead.
export const UPCOMING: UpcomingItem[] = [
  { status: 'in-progress', description: 'Saved drafts - but for workskin CSS' },
  { status: 'in-progress', description: 'Theming - moving the site\'s colors into CSS variables so it can be re-themed' },
  { status: 'planned', description: 'Version history for drafts' },
  { status: 'planned', description: 'Community-submitted workskins' },
  { status: 'planned', description: 'Mobile support' },
  { status: 'planned', description: 'AO3 site skin preview' },
  { status: 'planned', description: 'Export to PDF' },
  { status: 'planned', description: 'Collaborative editing' },
]
