import { useState, useCallback, useRef, type ReactNode } from 'react'
import Box from '@mui/material/Box'

interface SplitPanelProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
}

const MIN_PCT = 20
const MAX_PCT = 80

export default function SplitPanel({ leftPanel, rightPanel }: SplitPanelProps) {
  const [leftWidth, setLeftWidth] = useState(50)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const onMouseDown = useCallback(() => {
    isDragging.current = true

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const { left, width } = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - left) / width) * 100
      setLeftWidth(Math.min(MAX_PCT, Math.max(MIN_PCT, pct)))
    }

    const onMouseUp = () => {
      isDragging.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [])

  return (
    <Box ref={containerRef} sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ width: `${leftWidth}%`, overflow: 'hidden' }}>{leftPanel}</Box>
      <Box
        onMouseDown={onMouseDown}
        sx={{
          width: '6px',
          flexShrink: 0,
          cursor: 'col-resize',
          backgroundColor: 'divider',
          '&:hover': { backgroundColor: 'primary.main' },
        }}
      />
      <Box sx={{ flex: 1, overflow: 'hidden' }}>{rightPanel}</Box>
    </Box>
  )
}
