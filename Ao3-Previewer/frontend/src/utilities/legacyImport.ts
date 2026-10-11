// Merges in what the app saved on the site's old addresses. Browsers keep
// localStorage per address, so visitors arriving from the cloudfront.net host
// (what the first Twitter and Reddit posts linked to) or www would otherwise
// find an empty editor and drafts list here. public/legacy-handoff.html,
// served on those addresses, packs their storage into the URL fragment as
// "#ff-import=<payload>" and sends them here.
//
// Must run before the app renders, since the editor and drafts hooks read
// localStorage when they first mount.

const IMPORT_PREFIX = '#ff-import='

// Only accept a handoff that really came from one of the old addresses, so a
// crafted link can't write into someone's storage.
const LEGACY_ORIGINS = ['https://d2gmcdwlhahrqc.cloudfront.net', 'https://www.ficformatter.com']

// Old addresses already imported from. Each is imported once, so data still
// sitting on the old address can't bring back drafts deleted here since.
const IMPORTED_FROM_KEY = 'ao3-legacy-imported-from'

const DRAFTS_INDEX_KEY = 'ao3-drafts-index'
// Filled in only when there's nothing here yet, so work already done on
// ficformatter.com is never overwritten.
const FILL_IF_EMPTY_KEYS = [
  'ao3-editor-state',
  'ao3-rich-text-state',
  'ao3-changelog-last-seen',
  'ao3-bug-report-notice-seen',
  'ficformatter-language',
]

interface DraftIndexEntry {
  id: string
  updatedAt: string
  [key: string]: unknown
}

function legacyOriginOf(referrer: string): string | undefined {
  return LEGACY_ORIGINS.find((origin) => referrer === origin || referrer.startsWith(`${origin}/`))
}

function importedFrom(storage: Storage): string[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(IMPORTED_FROM_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((o): o is string => typeof o === 'string') : []
  } catch {
    return []
  }
}

async function decode(payload: string): Promise<Record<string, unknown>> {
  const kind = payload[0]
  const base64 = payload.slice(1).replace(/-/g, '+').replace(/_/g, '/')
  let bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  if (kind === 'z') {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
    bytes = new Uint8Array(await new Response(stream).arrayBuffer())
  } else if (kind !== 'j') {
    throw new Error(`Unknown handoff payload format "${kind}"`)
  }
  const data: unknown = JSON.parse(new TextDecoder().decode(bytes))
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Handoff payload is not an object')
  return data as Record<string, unknown>
}

function parseDraftsIndex(raw: unknown): DraftIndexEntry[] {
  if (typeof raw !== 'string') return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is DraftIndexEntry =>
        !!e && typeof e === 'object' && typeof e.id === 'string' && typeof e.updatedAt === 'string',
    )
  } catch {
    return []
  }
}

// An editor that holds nothing worth keeping: missing, blank, or the
// editor's own empty state.
function isEmptyValue(key: string, value: string | null): boolean {
  if (value === null || value.trim() === '') return true
  if (key === 'ao3-editor-state') {
    try {
      const { html, css } = JSON.parse(value) as { html?: string; css?: string }
      return !html?.trim() && !css?.trim()
    } catch {
      return false
    }
  }
  if (key === 'ao3-rich-text-state') return value.trim() === '<p></p>'
  return false
}

export function mergeLegacyData(data: Record<string, unknown>, storage: Storage): void {
  // Drafts list: everything from both, keeping the newer copy of a draft
  // that's in both.
  const imported = parseDraftsIndex(data[DRAFTS_INDEX_KEY])
  if (imported.length > 0) {
    const byId = new Map<string, DraftIndexEntry>()
    for (const entry of [...parseDraftsIndex(storage.getItem(DRAFTS_INDEX_KEY)), ...imported]) {
      const existing = byId.get(entry.id)
      if (!existing || new Date(entry.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
        byId.set(entry.id, entry)
      }
    }
    storage.setItem(DRAFTS_INDEX_KEY, JSON.stringify([...byId.values()]))
  }

  for (const key of FILL_IF_EMPTY_KEYS) {
    const value = data[key]
    if (typeof value !== 'string' || isEmptyValue(key, value)) continue
    if (isEmptyValue(key, storage.getItem(key))) storage.setItem(key, value)
  }
}

export async function importLegacyData(): Promise<void> {
  if (!window.location.hash.startsWith(IMPORT_PREFIX)) return
  const payload = window.location.hash.slice(IMPORT_PREFIX.length)
  // Drop the payload from the address bar (and history) whatever happens next.
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)

  const origin = legacyOriginOf(document.referrer)
  if (!origin) return
  const storage = window.localStorage
  const alreadyImported = importedFrom(storage)
  if (alreadyImported.includes(origin)) return
  try {
    mergeLegacyData(await decode(payload), storage)
    storage.setItem(IMPORTED_FROM_KEY, JSON.stringify([...alreadyImported, origin]))
  } catch (err) {
    console.warn('Could not import saved data from the old address:', err)
  }
}
