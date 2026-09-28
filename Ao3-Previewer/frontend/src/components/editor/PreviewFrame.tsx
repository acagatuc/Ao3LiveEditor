import { useRef, useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import ShareIcon from '@mui/icons-material/Share'
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined'
import { generateSrcdoc } from '../../utilities/generateSrcdoc'
import ShareModal from './ShareModal'
import BugReportDialog from './BugReportDialog'
import './PreviewFrame.css'

interface PreviewFrameProps {
  html: string
  css: string
  reportOpen: boolean
  onReportOpenChange: (open: boolean) => void
  onValidateCss: () => void
}

export default function PreviewFrame({
  html,
  css,
  reportOpen,
  onReportOpenChange,
  onValidateCss,
}: PreviewFrameProps) {
  const { t } = useTranslation(['editor', 'common'])
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
        <div className="preview-header-title">{t('preview.heading')}</div>
        <div className="preview-header-actions">
          <Tooltip title={t('preview.reportProblemTooltip')} placement="bottom">
            <Button
              size="small"
              variant="text"
              startIcon={<BugReportOutlinedIcon />}
              onClick={() => onReportOpenChange(true)}
            >
              {t('preview.reportProblem')}
            </Button>
          </Tooltip>
          <Button
            size="small"
            variant="outlined"
            onClick={handleToggleCreatorStyle}
          >
            {hideCreatorStyleMode ? t('common:preview.showCreatorStyle') : t('common:preview.hideCreatorStyle')}
          </Button>
        </div>
      </div>
      <Divider />

      <div className="preview-body">
        <iframe
          ref={iframeRef}
          className="preview-frame"
          sandbox="allow-scripts"
          srcDoc={srcdoc}
          title={t('preview.iframeTitle')}
        />
      </div>

      <div className="preview-footer">
        <Button
          size="small"
          variant="text"
          startIcon={<ShareIcon />}
          onClick={() => setShareOpen(true)}
        >
          {t('preview.share')}
        </Button>
        <Tooltip
          title={t('preview.linksDisabledTooltip')}
          placement="top"
        >
          <div className="preview-footer-label">
            <LinkOffIcon sx={{ fontSize: 16 }} />
            <span>{t('preview.linksDisabled')}</span>
          </div>
        </Tooltip>
      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        html={html}
        css={css}
      />

      <BugReportDialog
        open={reportOpen}
        onClose={() => onReportOpenChange(false)}
        html={html}
        css={css}
        onValidateCss={onValidateCss}
      />
    </div>
  )
}
