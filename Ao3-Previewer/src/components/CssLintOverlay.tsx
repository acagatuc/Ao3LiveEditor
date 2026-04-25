import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import type { PositionedWarning } from '../composables/useCssAnalyzer'

interface CssLintOverlayProps {
  warnings: PositionedWarning[]
  rawCss: string
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

interface OverlayMetrics {
  lineHeight: number
  paddingTop: number
  scrollTop: number
  width: number
  height: number
}

export default function CssLintOverlay({ warnings, rawCss, textareaRef }: CssLintOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState<OverlayMetrics | null>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const measure = () => {
      const style = window.getComputedStyle(textarea)
      setMetrics({
        lineHeight: parseFloat(style.lineHeight) || 20,
        paddingTop: parseFloat(style.paddingTop) || 0,
        scrollTop: textarea.scrollTop,
        width: textarea.offsetWidth,
        height: textarea.offsetHeight,
      })
    }

    const onScroll = () => {
      setMetrics((m) => (m ? { ...m, scrollTop: textarea.scrollTop } : m))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(textarea)
    textarea.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      ro.disconnect()
      textarea.removeEventListener('scroll', onScroll)
    }
  }, [textareaRef, rawCss])

  if (!metrics || warnings.length === 0) return null

  return (
    <Box
      ref={overlayRef}
      aria-hidden="true"
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: metrics.width,
        height: metrics.height,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {warnings.map((w, i) => {
        const top = metrics.paddingTop + (w.line - 1) * metrics.lineHeight - metrics.scrollTop
        if (top < 0 || top > metrics.height) return null
        return (
          <Tooltip key={i} title={w.message} placement="right">
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top,
                width: '100%',
                height: metrics.lineHeight,
                pointerEvents: 'auto',
                borderBottom: '2px wavy',
                borderColor: 'warning.main',
                opacity: 0.7,
              }}
            />
          </Tooltip>
        )
      })}
    </Box>
  )
}
