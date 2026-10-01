import CodeIcon from '@mui/icons-material/Code'
import ArticleIcon from '@mui/icons-material/Article'
import type { SvgIconComponent } from '@mui/icons-material'
import type { DraftPayloadType } from '../api/drafts'
import i18n from '../i18n'

export function editorPathFor(payloadType: DraftPayloadType): string {
  return payloadType === 'richtext' ? '/rich-text' : '/'
}

export function payloadTypeLabel(payloadType: DraftPayloadType): string {
  return i18n.t(`payloadType.${payloadType}`)
}

export function payloadTypeColor(payloadType: DraftPayloadType): 'primary' | 'secondary' {
  return payloadType === 'richtext' ? 'secondary' : 'primary'
}

export function payloadTypeIcon(payloadType: DraftPayloadType): SvgIconComponent {
  return payloadType === 'richtext' ? ArticleIcon : CodeIcon
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return i18n.t('relativeTime.justNow')
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return i18n.t('relativeTime.minutesAgo', { count: diffMin })
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return i18n.t('relativeTime.hoursAgo', { count: diffHr })
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return i18n.t('relativeTime.daysAgo', { count: diffDay })
  return new Date(iso).toLocaleDateString(i18n.resolvedLanguage)
}
