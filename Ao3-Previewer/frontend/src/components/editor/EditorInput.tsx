import { useRef, useState, useMemo } from 'react'
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
import { useCssAnalyzer } from '../../hooks/useCssAnalyzer'
import type { PositionedWarning } from '../../hooks/useCssAnalyzer'
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
}

type TabValue = 'html' | 'css'

interface Snack {
  message: string
  severity: 'success' | 'error'
}

export default function EditorInput({ html, css, onHtmlChange, onCssChange }: EditorInputProps) {
  const [tab, setTab] = useState<TabValue>('html')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
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

  function validateCss() {
    analyze(css)
  }

  function onJumpToWarning(w: PositionedWarning) {
    if (!textareaRef.current || !w.line) return
    const lineHeight = 20
    textareaRef.current.scrollTop = (w.line - 1) * lineHeight
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(tab === 'html' ? html : css)
      setSnack({ message: `Copied ${tab.toUpperCase()} to clipboard!`, severity: 'success' })
    } catch {
      setSnack({ message: 'Failed to copy.', severity: 'error' })
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
        <Tab value="html" label="HTML" />
        <Tab value="css" label="CSS" />
      </Tabs>
      <Divider />

      <div className="editor-body">
        {tab === 'html' && (
          <textarea
            ref={textareaRef}
            className="editor-textarea"
            placeholder="Write HTML here"
            value={html}
            onChange={handleHtmlChange}
            spellCheck={false}
          />
        )}

        {tab === 'css' && (
          <div className="textarea-lint-wrap">
            <textarea
              ref={textareaRef}
              className="editor-textarea"
              placeholder="Write CSS here"
              value={css}
              onChange={handleCssChange}
              spellCheck={false}
            />
            {lintStatus !== 'idle' && (
              <CssLintOverlay
                warnings={lintWarnings}
                rawCss={css}
                textareaRef={textareaRef}
              />
            )}
          </div>
        )}

        <div className="copy-button">
          <IconButton size="small" onClick={copyToClipboard} title="Copy to clipboard">
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
          startIcon={<DownloadIcon />}
          onClick={saveToFile}
        >
          Export
        </Button>

        {tab === 'html' && (
          <Tooltip title="Wraps lone text in paragraph tags and clears html-like whitespace">
            <Button
              size="small"
              variant="text"
              startIcon={<FormatIndentIncreaseIcon />}
              onClick={formatHtml}
            >
              Format for AO3
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
              Validate CSS
            </Button>

            <Button
              size="small"
              variant="text"
              startIcon={<FormatIndentIncreaseIcon />}
              onClick={autoFormatCss}
            >
              Format CSS
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
