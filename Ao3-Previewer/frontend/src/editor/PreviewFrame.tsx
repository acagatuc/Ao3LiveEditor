import { useRef, useState, useEffect, useMemo } from 'react'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import { generateSrcdoc } from './generateSrcdoc'
import { scrollSync, onEditorScroll } from './scrollStateSync'
import './PreviewFrame.css'

interface PreviewFrameProps {
  html: string
  css: string
}

export default function PreviewFrame({ html, css }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [hideCreatorStyleMode, setHideCreatorStyleMode] = useState(false)
  const [debouncedHtml, setDebouncedHtml] = useState(html)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce HTML changes (400ms)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedHtml(html), 400)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [html])

  // Scroll sync: when editor scrolls, sync iframe
  useEffect(() => {
    return onEditorScroll((ratio) => {
      const iframe = iframeRef.current
      const doc = iframe?.contentDocument?.documentElement
      if (!iframe || !doc) return
      scrollSync.isSyncing = true
      const maxScroll = doc.scrollHeight - doc.clientHeight
      iframe.contentWindow?.scrollTo(0, ratio * maxScroll)
      requestAnimationFrame(() => {
        scrollSync.isSyncing = false
      })
    })
  }, [])

  // Re-attach scroll listener each time iframe loads
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    function onLoad() {
      const win = iframe?.contentWindow
      if (!win) return

      // Disable link clicks
      iframe?.contentDocument?.addEventListener(
        'click',
        (e) => {
          const target = e.target as HTMLElement | null
          if (target?.closest('a')) {
            e.preventDefault()
            e.stopPropagation()
          }
        },
        true,
      )
    }

    iframe.addEventListener('load', onLoad)
    return () => iframe.removeEventListener('load', onLoad)
  }, [])

  const srcdoc = useMemo(
    () =>
      generateSrcdoc({
        html: hideCreatorStyleMode ? debouncedHtml : debouncedHtml,
        css: hideCreatorStyleMode ? '' : css,
        hideCreatorStyle: hideCreatorStyleMode,
      }),
    [hideCreatorStyleMode, debouncedHtml, css],
  )

  return (
    <div className="preview-root">
      <div className="preview-header-row">
        <div className="preview-header-title">Preview:</div>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setHideCreatorStyleMode((m) => !m)}
        >
          {hideCreatorStyleMode ? "Show Creator's Style" : "Hide Creator's Style"}
        </Button>
      </div>
      <Divider />

      <div className="preview-body">
        <iframe
          ref={iframeRef}
          className="preview-frame"
          sandbox="allow-same-origin"
          srcDoc={srcdoc}
          title="Preview"
        />
      </div>

      <div className="preview-footer">
        <Tooltip
          title="Links disabled in preview. You can still open them in a new tab."
          placement="top"
        >
          <div className="preview-footer-label">
            <LinkOffIcon sx={{ fontSize: 16 }} />
            <span>Links disabled</span>
          </div>
        </Tooltip>
      </div>
    </div>
  )
}
