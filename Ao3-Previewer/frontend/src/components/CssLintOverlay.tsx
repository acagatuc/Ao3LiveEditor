import { useRef, useState, useMemo, useEffect, type CSSProperties } from 'react'
import type { PositionedWarning } from '../hooks/useCssAnalyzer'
import type { CssWarning } from '../utilities/analyzeCss'
import './CssLintOverlay.css'

interface Measure {
  offsetTop: number
  offsetLeft: number
  width: number
  height: number
  paddingTop: number
  paddingLeft: number
  fontSize: number
  lineHeight: number
  scrollTop: number
}

interface CssLintOverlayProps {
  warnings: PositionedWarning[]
  rawCss: string
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

const TYPE_PRIORITY: Record<CssWarning['type'], number> = {
  'invalid-property': 4,
  'disallowed-atrule': 3,
  'invalid-var-usage': 2,
  'value-invalid': 2,
  'duplicate-property': 1,
  'comment-stripped': 0,
}

const SHORT: Record<CssWarning['type'], string> = {
  'invalid-property': 'PROP',
  'duplicate-property': 'DUP',
  'disallowed-atrule': '@RULE',
  'comment-stripped': 'CMT',
  'invalid-var-usage': 'VAR',
  'value-invalid': 'VAL',
}

function worstType(ws: PositionedWarning[]): CssWarning['type'] {
  return ws.reduce((a, b) => (TYPE_PRIORITY[a.type] >= TYPE_PRIORITY[b.type] ? a : b)).type
}

export default function CssLintOverlay({ warnings, rawCss, textareaRef }: CssLintOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const [measure, setMeasure] = useState<Measure>({
    offsetTop: 0, offsetLeft: 0, width: 0, height: 0,
    paddingTop: 8, paddingLeft: 16, fontSize: 13, lineHeight: 20, scrollTop: 0,
  })

  function readMeasure() {
    const ta = textareaRef.current
    if (!ta || !overlayRef.current) return
    const cs = window.getComputedStyle(ta)
    const parsePx = (v: string) => parseFloat(v) || 0
    const fontSize = parsePx(cs.fontSize)
    const rawLh = cs.lineHeight
    const lineHeight = rawLh === 'normal' ? Math.round(fontSize * 1.5) : parsePx(rawLh)
    const wrap = overlayRef.current.closest('.editor-body') as HTMLElement | null
    const taRect = ta.getBoundingClientRect()
    const wrapRect = wrap?.getBoundingClientRect() ?? { top: 0, left: 0 }
    setMeasure({
      offsetTop: taRect.top - wrapRect.top,
      offsetLeft: taRect.left - wrapRect.left,
      width: ta.clientWidth,
      height: ta.clientHeight,
      paddingTop: parsePx(cs.paddingTop),
      paddingLeft: parsePx(cs.paddingLeft),
      fontSize,
      lineHeight,
      scrollTop: ta.scrollTop,
    })
  }

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return

    readMeasure()

    const onScroll = () => {
      if (textareaRef.current) {
        setMeasure((m) => ({ ...m, scrollTop: textareaRef.current!.scrollTop }))
      }
    }

    ta.addEventListener('scroll', onScroll, { passive: true })

    const ro = new ResizeObserver(readMeasure)
    ro.observe(ta)
    const wrap = overlayRef.current?.closest('.editor-body') as HTMLElement | null
    if (wrap) ro.observe(wrap)

    return () => {
      ro.disconnect()
      ta.removeEventListener('scroll', onScroll)
    }
  }, [])

  const allAnnotatedLines = useMemo(() => {
    const byLine = new Map<number, PositionedWarning[]>()
    for (const w of warnings) {
      if (w.line == null) continue
      const bucket = byLine.get(w.line) ?? []
      bucket.push(w)
      byLine.set(w.line, bucket)
    }
    return rawCss.split('\n').map((text, i) => {
      const ws = byLine.get(i + 1) ?? []
      const hasWarning = ws.length > 0
      const selectorText = (text.split('{')[0] ?? text).trimEnd()
      return {
        index: i,
        hasWarning,
        warnings: ws,
        worstType: hasWarning ? worstType(ws) : ('comment-stripped' as CssWarning['type']),
        selectorWidth: selectorText.length - 1,
      }
    })
  }, [warnings, rawCss])

  const visibleWarnedLines = useMemo(
    () => allAnnotatedLines.filter((l) => l.hasWarning),
    [allAnnotatedLines],
  )

  const overlayStyle: CSSProperties = {
    position: 'absolute',
    top: measure.offsetTop,
    left: measure.offsetLeft,
    width: measure.width,
    height: measure.height,
    pointerEvents: 'none',
    overflow: 'hidden',
    boxSizing: 'border-box',
    zIndex: 2,
  }

  const clipStyle: CSSProperties = {
    position: 'relative',
    paddingLeft: measure.paddingLeft,
    paddingRight: 20,
    boxSizing: 'border-box',
    height: '100%',
  }

  function linePositionStyle(lineIndex: number): CSSProperties {
    const { paddingTop, lineHeight, scrollTop } = measure
    const top = paddingTop + lineIndex * lineHeight - scrollTop
    return {
      position: 'absolute',
      top,
      left: 10,
      right: 20,
      height: lineHeight,
      lineHeight: `${lineHeight}px`,
      fontSize: measure.fontSize,
    }
  }

  return (
    <div ref={overlayRef} className="lint-overlay" aria-hidden="true" style={overlayStyle}>
      <div style={clipStyle}>
        {visibleWarnedLines.map((line) => (
          <div key={line.index} className="lint-line" style={linePositionStyle(line.index)}>
            <span className="lint-line__squiggle" style={{ width: `${line.selectorWidth}ch` }} />
            <span className={`lint-line__gutter lint-line__gutter--${line.worstType}`}>
              <span className="lint-line__dot" />
              <span className="lint-line__tooltip">
                {line.warnings.map((w, i) => (
                  <span key={i} className={`tooltip__row tooltip__row--${w.type}`}>
                    <span className="tooltip__badge">{SHORT[w.type]}</span>
                    {w.message}
                  </span>
                ))}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
