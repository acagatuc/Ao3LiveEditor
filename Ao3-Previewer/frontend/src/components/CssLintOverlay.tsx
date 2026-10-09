import { Fragment, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { CssWarning } from '../utilities/analyzeCss'
import './CssLintOverlay.css'

// A copy of the CSS laid over the textarea, in the same grid cell, with the same font, padding
// and wrapping, and its text invisible. Flagged text gets a wavy underline, so the browser
// sizes and wraps the squiggles exactly like the real text. The copy also sets the textarea's
// height (see .textarea-lint-stack), so the two scroll together in one box and can't drift.

interface CssLintOverlayProps {
  css: string
  warnings: CssWarning[]
}

const TYPE_PRIORITY: Record<CssWarning['type'], number> = {
  'invalid-property': 4,
  'disallowed-atrule': 3,
  'invalid-var-usage': 2,
  'value-invalid': 2,
  'duplicate-property': 1,
  'comment-stripped': 0,
}

function worstType(ws: CssWarning[]): CssWarning['type'] {
  return ws.reduce((a, b) => (TYPE_PRIORITY[a.type] >= TYPE_PRIORITY[b.type] ? a : b)).type
}

interface Segment {
  start: number
  end: number
  underlined: boolean
  // Warnings for the line starting here, shown as one dot at the right edge.
  lineWarnings?: CssWarning[]
}

// Cuts the text wherever an underline starts or ends, or a warned line begins.
function segment(css: string, warnings: CssWarning[]): Segment[] {
  const ranges = mergeRanges(warnings.map((w) => [w.start, w.end] as const))

  const byLineStart = new Map<number, CssWarning[]>()
  for (const w of warnings) {
    const lineStart = css.lastIndexOf('\n', w.start - 1) + 1
    byLineStart.set(lineStart, [...(byLineStart.get(lineStart) ?? []), w])
  }

  const cuts = new Set([0, css.length, ...byLineStart.keys(), ...ranges.flat()])
  const sorted = [...cuts].sort((a, b) => a - b)

  const segments: Segment[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i]!
    const end = sorted[i + 1]!
    segments.push({
      start,
      end,
      underlined: ranges.some(([from, to]) => from <= start && end <= to),
      lineWarnings: byLineStart.get(start),
    })
  }
  return segments
}

function mergeRanges(ranges: (readonly [number, number])[]): [number, number][] {
  const merged: [number, number][] = []
  for (const [start, end] of [...ranges].sort((a, b) => a[0] - b[0])) {
    const last = merged[merged.length - 1]
    if (last && start <= last[1]) last[1] = Math.max(last[1], end)
    else merged.push([start, end])
  }
  return merged
}

export default function CssLintOverlay({ css, warnings }: CssLintOverlayProps) {
  const { t } = useTranslation('cssWarnings')
  const segments = useMemo(() => segment(css, warnings), [css, warnings])

  return (
    <div className="lint-mirror" aria-hidden="true">
      {segments.map((s) => {
        const text = css.slice(s.start, s.end)
        return (
          <Fragment key={s.start}>
            {s.lineWarnings && (
              <span
                className={`lint-line__gutter lint-line__gutter--${worstType(s.lineWarnings)}`}
                data-line={s.lineWarnings[0]!.line}
              >
                <span className="lint-line__dot" />
                <span className="lint-line__tooltip">
                  {s.lineWarnings.map((w, i) => (
                    <span key={i} className={`tooltip__row tooltip__row--${w.type}`}>
                      <span className="tooltip__badge">{t(`short.${w.type}`)}</span>
                      {t(`messages.${w.message.key}`, w.message.params)}
                    </span>
                  ))}
                </span>
              </span>
            )}
            {s.underlined ? <span className="lint-mirror__squiggle">{text}</span> : text}
          </Fragment>
        )
      })}
      {/* A textarea shows an empty last line after a trailing newline. This keeps the copy as tall. */}
      {' '}
    </div>
  )
}
