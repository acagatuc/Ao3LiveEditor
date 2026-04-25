import { useRef, useState } from 'react'
import './SplitPanel.css'

interface SplitPanelProps {
  left: React.ReactNode
  right: React.ReactNode
}

export default function SplitPanel({ left, right }: SplitPanelProps) {
  const [leftWidth, setLeftWidth] = useState(50)
  const dragging = useRef(false)

  const startDrag = () => {
    dragging.current = true
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', stopDrag)
  }

  const onDrag = (e: MouseEvent) => {
    if (!dragging.current) return
    const percent = (e.clientX / window.innerWidth) * 100
    setLeftWidth(Math.min(80, Math.max(20, percent)))
  }

  const stopDrag = () => {
    dragging.current = false
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', stopDrag)
  }

  return (
    <div className="split-root">
      <div className="split-panel" style={{ width: `${leftWidth}%` }}>
        {left}
      </div>
      <div className="split-divider" onMouseDown={startDrag} />
      <div className="split-panel" style={{ width: `${100 - leftWidth}%` }}>
        {right}
      </div>
    </div>
  )
}
