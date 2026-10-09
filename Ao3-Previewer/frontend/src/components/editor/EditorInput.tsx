import { useRef, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import FormatIndentIncreaseIcon from '@mui/icons-material/FormatIndentIncrease'
import SaveIcon from '@mui/icons-material/Save'
import { useCssAnalyzer } from '../../hooks/useCssAnalyzer'
import type { CssWarning } from '../../utilities/analyzeCss'
import { formatCss } from '../../utilities/formatCss'
import { formatForAo3 } from '../../utilities/formatForAo3'
import CssWarningBanner from '../CssWarningBanner'
import CssLintOverlay from '../CssLintOverlay'
import './EditorInput.css'

interface EditorInputProps {
  html: string
  css: string
  onHtmlChange: (html: string) => void
  onCssChange: (css: string) => void
  onOpenSaveDraft: () => void
  lintRequest?: number
}

type TabValue = 'html' | 'css'

interface Snack {
  message: string
  severity: 'success' | 'error'
}

export default function EditorInput({
  html,
  css,
  onHtmlChange,
  onCssChange,
  onOpenSaveDraft,
  lintRequest = 0,
}: EditorInputProps) {
  const { t } = useTranslation(['editor', 'common'])
  const [tab, setTab] = useState<TabValue>('html')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const cssScrollRef = useRef<HTMLDivElement | null>(null)
  const [snack, setSnack] = useState<Snack | null>(null)

  const { warnings: lintWarnings, status: lintStatus, isAnalyzing, analyze, reset: resetLint } =
    useCssAnalyzer()

  const lintButtonColor = useMemo(() => {
    if (lintStatus === 'clean') return 'success' as const
    if (lintStatus === 'warnings') return 'warning' as const
    if (lintStatus === 'error') return 'error' as const
    return 'inherit' as const
  }, [lintStatus])

  function handleHtmlChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onHtmlChange(e.target.value)
  }

  function handleCssChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onCssChange(e.target.value)
    if (lintStatus !== 'idle') resetLint()
  }

  function formatHtml() {
    onHtmlChange(formatForAo3(html))
  }

  async function autoFormatCss() {
    onCssChange(await formatCss(css))
  }

  // Bumped from outside (the bug report dialog) to switch to the CSS tab and run the linter.
  const [handledLintRequest, setHandledLintRequest] = useState(lintRequest)
  if (lintRequest !== handledLintRequest) {
    setHandledLintRequest(lintRequest)
    setTab('css')
    analyze(css)
  }

  function validateCss() {
    analyze(css)
  }

  // Scrolls the warning's line to the top, found by its dot in the overlay so wrapped lines
  // above it are counted.
  function onJumpToWarning(w: CssWarning) {
    const box = cssScrollRef.current
    const marker = box?.querySelector(`[data-line="${w.line}"]`)
    if (!box || !marker) return
    box.scrollTop += marker.getBoundingClientRect().top - box.getBoundingClientRect().top
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(tab === 'html' ? html : css)
      setSnack({ message: t('input.copied', { tab: t(`tabs.${tab}`) }), severity: 'success' })
    } catch {
      setSnack({ message: t('input.copyFailed'), severity: 'error' })
    }
  }

  function saveToFile() {
    const content = tab === 'html' ? html : css
    const filename = tab === 'html' ? 'html.txt' : 'css.txt'
    const blob = new Blob([content], { type: 'text/plain' })
    const link = document.createElement('a')
    link.download = filename
    link.href = URL.createObjectURL(blob)
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="editor-root">
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab value="html" label={t('tabs.html')} />
        <Tab value="css" label={t('tabs.css')} />
      </Tabs>
      <Divider />

      <div className="editor-body">
        {tab === 'html' && (
          <textarea
            ref={textareaRef}
            className="editor-textarea"
            placeholder={t('input.htmlPlaceholder')}
            value={html}
            onChange={handleHtmlChange}
            spellCheck={false}
          />
        )}

        {tab === 'css' && (
          // The textarea grows to fit its text, so this box does the scrolling for both it and
          // the lint overlay, and they can't scroll apart.
          <div className="textarea-lint-wrap" ref={cssScrollRef}>
            <div className="textarea-lint-stack">
              <textarea
                ref={textareaRef}
                className="editor-textarea editor-textarea--grows"
                placeholder={t('input.cssPlaceholder')}
                value={css}
                onChange={handleCssChange}
                spellCheck={false}
              />
              <CssLintOverlay css={css} warnings={lintStatus === 'idle' ? [] : lintWarnings} />
            </div>
          </div>
        )}

        <div className="copy-button">
          <IconButton size="small" onClick={copyToClipboard} title={t('input.copyToClipboard')}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      {tab === 'css' && (
        <CssWarningBanner
          warnings={lintWarnings}
          visible={lintStatus !== 'idle'}
          onDismiss={resetLint}
          onJump={onJumpToWarning}
        />
      )}

      <div className="editor-footer">
        <Button
          size="small"
          variant="text"
          startIcon={<SaveIcon />}
          onClick={onOpenSaveDraft}
        >
          {t('common:drafts.saveDraft')}
        </Button>

        <Button
          size="small"
          variant="text"
          startIcon={<DownloadIcon />}
          onClick={saveToFile}
        >
          {t('input.export')}
        </Button>

        {tab === 'html' && (
          <Tooltip title={t('input.formatForAo3Tooltip')}>
            <Button
              size="small"
              variant="text"
              startIcon={<FormatIndentIncreaseIcon />}
              onClick={formatHtml}
            >
              {t('input.formatForAo3')}
            </Button>
          </Tooltip>
        )}

        {tab === 'css' && (
          <>
            <Button
              size="small"
              variant="text"
              startIcon={
                isAnalyzing ? <CircularProgress size={14} /> : <CheckCircleOutlineIcon />
              }
              color={lintButtonColor}
              onClick={validateCss}
              disabled={isAnalyzing}
            >
              {t('input.validateCss')}
            </Button>

            <Button
              size="small"
              variant="text"
              startIcon={<FormatIndentIncreaseIcon />}
              onClick={autoFormatCss}
            >
              {t('input.formatCss')}
            </Button>
          </>
        )}
      </div>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snack?.severity} onClose={() => setSnack(null)}>
          {snack?.message}
        </Alert>
      </Snackbar>
    </div>
  )
}
