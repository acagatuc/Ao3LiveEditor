import { useState, useMemo } from 'react'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import type { PositionedWarning } from '../composables/useCssAnalyzer'
import type { CssWarning } from '../utilities/analyzeCss'

interface CssWarningBannerProps {
  warnings: PositionedWarning[]
  visible?: boolean
  onDismiss: () => void
  onJump: (warning: PositionedWarning) => void
}

const SHORT: Record<CssWarning['type'], string> = {
  'invalid-property': 'PROP',
  'duplicate-property': 'DUP',
  'disallowed-atrule': '@RULE',
  'comment-stripped': 'CMT',
  'invalid-var-usage': 'VAR',
  'value-invalid': 'VAL',
}

const LABEL: Record<CssWarning['type'], string> = {
  'invalid-property': 'Invalid property',
  'duplicate-property': 'Duplicate property',
  'disallowed-atrule': 'Disallowed @rule',
  'comment-stripped': 'Comment stripped',
  'invalid-var-usage': 'Invalid var() usage',
  'value-invalid': 'Invalid value',
}

const CHIP_STYLE: Record<CssWarning['type'], { background: string; color: string }> = {
  'invalid-property':   { background: '#7f1d1d', color: '#fca5a5' },
  'duplicate-property': { background: '#78350f', color: '#fde68a' },
  'disallowed-atrule':  { background: '#4c1d95', color: '#ddd6fe' },
  'comment-stripped':   { background: '#1e3a5f', color: '#93c5fd' },
  'invalid-var-usage':  { background: '#064e3b', color: '#6ee7b7' },
  'value-invalid':      { background: '#78350f', color: '#fde68a' },
}

export default function CssWarningBanner({
  warnings,
  visible = true,
  onDismiss,
  onJump,
}: CssWarningBannerProps) {
  const [collapsed, setCollapsed] = useState(false)

  const activeSummary = useMemo<[CssWarning['type'], number][]>(() => {
    const map = new Map<CssWarning['type'], number>()
    for (const w of warnings) {
      map.set(w.type, (map.get(w.type) ?? 0) + 1)
    }
    return [...map.entries()]
  }, [warnings])

  if (!visible || warnings.length === 0) return null

  const FONT = "'JetBrains Mono', 'Fira Mono', 'Consolas', monospace"

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        fontFamily: FONT,
        fontSize: '12px',
        background: '#1a1a1a',
        borderLeft: '3px solid #f59e0b',
        borderRadius: '4px',
        color: '#e5e7eb',
        overflow: 'hidden',
        userSelect: 'none',
        margin: '0 8px',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setCollapsed((c) => !c)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 10px',
          cursor: 'pointer',
          borderBottom: collapsed ? '1px solid transparent' : '1px solid #2d2d2d',
          transition: 'border-color 0.15s',
        }}
      >
        <span style={{ color: '#f59e0b', fontSize: '13px', flexShrink: 0 }}>⚠</span>
        <span style={{ fontWeight: 600, color: '#f59e0b', whiteSpace: 'nowrap' }}>
          {warnings.length} lint {warnings.length === 1 ? 'warning' : 'warnings'}
        </span>

        {/* Chips */}
        <span style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {activeSummary.map(([type, count]) => (
            <span
              key={type}
              title={LABEL[type]}
              style={{
                padding: '1px 5px',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                ...CHIP_STYLE[type],
              }}
            >
              {SHORT[type]}&nbsp;{count}
            </span>
          ))}
        </span>

        <span style={{ flex: 1 }} />

        <IconButton
          size="small"
          aria-label={collapsed ? 'Expand warnings' : 'Collapse warnings'}
          onClick={(e) => { e.stopPropagation(); setCollapsed((c) => !c) }}
          sx={{ color: '#9ca3af', padding: '2px' }}
        >
          {collapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
        </IconButton>
        <IconButton
          size="small"
          aria-label="Dismiss warnings"
          onClick={(e) => { e.stopPropagation(); onDismiss() }}
          sx={{ color: '#9ca3af', padding: '2px' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      {/* Warning list */}
      {!collapsed && (
        <ul
          role="list"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: '4px 0',
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          {warnings.map((w, i) => (
            <li
              key={i}
              role="button"
              tabIndex={0}
              title={w.selector ? `Selector: ${w.selector}` : undefined}
              onClick={() => onJump(w)}
              onKeyDown={(e) => e.key === 'Enter' && onJump(w)}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
                padding: '5px 10px',
                cursor: 'pointer',
                outline: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#242424')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span
                style={{
                  flexShrink: 0,
                  padding: '1px 4px',
                  borderRadius: '2px',
                  fontSize: '9px',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  ...CHIP_STYLE[w.type],
                }}
              >
                {SHORT[w.type]}
              </span>
              <span style={{ flex: 1, color: '#e5e7eb', lineHeight: 1.4 }}>{w.message}</span>
              {w.line && (
                <span style={{ flexShrink: 0, color: '#9ca3af', fontSize: '10px' }}>
                  line {w.line}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
