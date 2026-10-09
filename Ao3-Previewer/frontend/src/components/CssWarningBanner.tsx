import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import IconButton from '@mui/material/IconButton'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import CloseIcon from '@mui/icons-material/Close'
import type { CssWarning } from '../utilities/analyzeCss'
import './CssWarningBanner.css'

interface CssWarningBannerProps {
  warnings: CssWarning[]
  visible?: boolean
  onDismiss: () => void
  onJump: (warning: CssWarning) => void
}

export default function CssWarningBanner({
  warnings,
  visible = true,
  onDismiss,
  onJump,
}: CssWarningBannerProps) {
  const { t } = useTranslation('cssWarnings')
  const [collapsed, setCollapsed] = useState(false)

  const activeSummary = useMemo<[CssWarning['type'], number][]>(() => {
    const map = new Map<CssWarning['type'], number>()
    for (const w of warnings) map.set(w.type, (map.get(w.type) ?? 0) + 1)
    return [...map.entries()]
  }, [warnings])

  if (!visible || warnings.length === 0) return null

  return (
    <div className="css-warning-banner" role="alert" aria-live="polite">
      <div className="banner__header" onClick={() => setCollapsed((c) => !c)}>
        <span className="banner__icon">⚠</span>
        <span className="banner__title">
          {t('banner.title', { count: warnings.length })}
        </span>
        <span className="banner__chips">
          {activeSummary.map(([type, count]) => (
            <span
              key={type}
              className={`chip chip--${type}`}
              title={t(`label.${type}`)}
            >
              {t(`short.${type}`)}&nbsp;{count}
            </span>
          ))}
        </span>
        <span className="banner__spacer" />
        <IconButton
          size="small"
          aria-label={collapsed ? t('banner.expand') : t('banner.collapse')}
          onClick={(e) => { e.stopPropagation(); setCollapsed((c) => !c) }}
          sx={{ color: '#9ca3af', padding: '2px' }}
        >
          {collapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
        </IconButton>
        <IconButton
          size="small"
          aria-label={t('banner.dismiss')}
          onClick={(e) => { e.stopPropagation(); onDismiss() }}
          sx={{ color: '#9ca3af', padding: '2px' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <div
        className="banner__list-container"
        style={{
          maxHeight: collapsed ? 0 : 220,
          opacity: collapsed ? 0 : 1,
          overflow: 'hidden',
          transition: 'max-height 0.2s ease, opacity 0.2s',
        }}
      >
        <ul className="banner__list" role="list">
          {warnings.map((w, i) => (
            <li
              key={i}
              className={`banner__item banner__item--${w.type}`}
              title={w.selector ? t('banner.selector', { selector: w.selector }) : undefined}
              tabIndex={0}
              role="button"
              onClick={() => onJump(w)}
              onKeyDown={(e) => e.key === 'Enter' && onJump(w)}
            >
              <span className={`item__badge badge--${w.type}`}>{t(`short.${w.type}`)}</span>
              <span className="item__msg">{t(`messages.${w.message.key}`, w.message.params)}</span>
              {w.line && <span className="item__line">{t('banner.line', { line: w.line })}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
