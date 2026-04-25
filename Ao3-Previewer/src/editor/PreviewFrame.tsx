import { useEffect, useRef, useState } from 'react'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import { generateSrcdoc } from './generateSrcdoc'
import { useScrollState } from './scrollStateSync'

interface PreviewFrameProps {
  html: string
  css: string
}

export default function PreviewFrame({ html, css }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [debouncedHtml, setDebouncedHtml] = useState(html)
  const [hideCreatorStyleMode, setHideCreatorStyleMode] = useState(false)
  const { editorScrollRatio, setPreviewScrollRatio, isSyncingScroll } = useScrollState()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedHtml(html), 400)
    return () => clearTimeout(timer)
  }, [html])

  const srcdoc = generateSrcdoc({
    html: debouncedHtml,
    css,
    hideCreatorStyle: hideCreatorStyleMode,
  })

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const onLoad = () => {
      const doc = iframe.contentDocument
      const win = iframe.contentWindow
      if (!doc || !win) return

      doc.addEventListener('click', (e) => {
        const anchor = (e.target as Element).closest('a')
        if (anchor) e.preventDefault()
      })

      const onIframeScroll = () => {
        if (isSyncingScroll.current) return
        const el = win.document.scrollingElement
        if (!el) return
        const max = el.scrollHeight - el.clientHeight
        if (max > 0) setPreviewScrollRatio(el.scrollTop / max)
      }

      win.addEventListener('scroll', onIframeScroll, { passive: true })
    }

    iframe.addEventListener('load', onLoad)
    return () => iframe.removeEventListener('load', onLoad)
  }, [isSyncingScroll, setPreviewScrollRatio])

  useEffect(() => {
    const iframe = iframeRef.current
    const win = iframe?.contentWindow
    if (!win) return

    isSyncingScroll.current = true
    requestAnimationFrame(() => {
      const el = win.document.scrollingElement
      if (el) {
        const max = el.scrollHeight - el.clientHeight
        el.scrollTop = editorScrollRatio * max
      }
      isSyncingScroll.current = false
    })
  }, [editorScrollRatio, isSyncingScroll])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '48px',
          padding: '0 16px',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '16px',
          }}
        >
          Preview:
        </span>
        <Button size="small" variant="outlined" onClick={() => setHideCreatorStyleMode((m) => !m)}>
          {hideCreatorStyleMode ? "Show Creator's Style" : "Hide Creator's Style"}
        </Button>
      </div>
      <Divider />

      {/* Preview body */}
      <div style={{ flex: 1, minHeight: 0, padding: '8px', overflow: 'hidden' }}>
        <iframe
          ref={iframeRef}
          srcDoc={srcdoc}
          sandbox="allow-same-origin"
          title="Preview"
          style={{
            width: '100%',
            height: '100%',
            border: '1px solid #aeaeae',
            borderRadius: '4px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          flexShrink: 0,
          height: '36px',
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '4px 8px',
        }}
      >
        <Tooltip title="Links disabled in preview. You can still open them in a new tab." placement="top">
          <div
            style={{
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
              fontSize: '0.75rem',
              color: 'rgba(0,0,0,0.6)',
              cursor: 'default',
            }}
          >
            <LinkOffIcon sx={{ fontSize: '16px' }} />
            <span>Links disabled</span>
          </div>
        </Tooltip>
      </div>
    </div>
  )
}
