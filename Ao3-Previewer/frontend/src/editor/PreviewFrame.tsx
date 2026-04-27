import { useRef, useState, useEffect, useMemo } from 'react'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import ShareIcon from '@mui/icons-material/Share'
import { generateSrcdoc } from './generateSrcdoc'
import ShareModal from '../components/ShareModal'
import './PreviewFrame.css'

interface PreviewFrameProps {
  html: string
  css: string
}

export default function PreviewFrame({ html, css }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [hideCreatorStyleMode, setHideCreatorStyleMode] = useState(false)
  const [debouncedHtml, setDebouncedHtml] = useState(html)
  const [shareOpen, setShareOpen] = useState(false)
  const iframeScrollY = useRef<number>(0)
  const savedScrollY = useRef<number>(0)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedHtml(html), 400)
    return () => clearTimeout(timer)
  }, [html])

  // Track the iframe's scroll position via postMessage (works without allow-same-origin).
  // Validate source to ensure messages come from our iframe, not arbitrary pages.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return
      if (e.data?.type === 'ao3:scroll' && typeof e.data.y === 'number') {
        iframeScrollY.current = e.data.y
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // After each iframe reload, restore scroll if the creator style button triggered it
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    function onLoad() {
      const y = savedScrollY.current
      if (y > 0) {
        iframe?.contentWindow?.postMessage({ type: 'ao3:setScroll', y }, '*')
        savedScrollY.current = 0
      }
    }

    iframe.addEventListener('load', onLoad)
    return () => iframe.removeEventListener('load', onLoad)
  }, [])

  const srcdoc = useMemo(
    () =>
      generateSrcdoc({
        html: debouncedHtml,
        css: hideCreatorStyleMode ? '' : css,
        hideCreatorStyle: hideCreatorStyleMode,
      }),
    [hideCreatorStyleMode, debouncedHtml, css],
  )

  function handleToggleCreatorStyle() {
    savedScrollY.current = iframeScrollY.current
    setHideCreatorStyleMode((m) => !m)
  }

  return (
    <div className="preview-root">
      <div className="preview-header-row">
        <div className="preview-header-title">Preview:</div>
        <Button
          size="small"
          variant="outlined"
          onClick={handleToggleCreatorStyle}
        >
          {hideCreatorStyleMode ? "Show Creator's Style" : "Hide Creator's Style"}
        </Button>
      </div>
      <Divider />

      <div className="preview-body">
        <iframe
          ref={iframeRef}
          className="preview-frame"
          sandbox="allow-scripts"
          srcDoc={srcdoc}
          title="Preview"
        />
      </div>

      <div className="preview-footer">
        <Button
          size="small"
          variant="text"
          startIcon={<ShareIcon />}
          onClick={() => setShareOpen(true)}
        >
          Share
        </Button>
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

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        html={html}
        css={css}
      />
    </div>
  )
}
