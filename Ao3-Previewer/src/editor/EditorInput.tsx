import { useRef, useCallback, useEffect, useState } from 'react'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import FormatIndentIncreaseIcon from '@mui/icons-material/FormatIndentIncrease'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import { toast } from 'react-toastify'
import { useCssAnalyzer } from '../composables/useCssAnalyzer'
import CssLintOverlay from '../components/CssLintOverlay'
import CssWarningBanner from '../components/CssWarningBanner'
import { formatCss } from '../utilities/formatCss'
import { useScrollState } from './scrollStateSync'
import type { PositionedWarning } from '../composables/useCssAnalyzer'

interface EditorInputProps {
  html: string
  css: string
  onHtmlChange: (html: string) => void
  onCssChange: (css: string) => void
}

type ActiveTab = 'html' | 'css'

const LINT_BUTTON_COLOR: Record<string, 'warning' | 'success' | 'error' | 'inherit'> = {
  idle: 'inherit',
  clean: 'success',
  warnings: 'warning',
  error: 'error',
}

export default function EditorInput({ html, css, onHtmlChange, onCssChange }: EditorInputProps) {
  const [tab, setTab] = useState<ActiveTab>('html')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { warnings, status, isAnalyzing, analyze, reset } = useCssAnalyzer()
  const { setEditorScrollRatio } = useScrollState()

  useEffect(() => {
    if (status !== 'idle') reset()
  }, [css]) // eslint-disable-line react-hooks/exhaustive-deps

  const autoFormatCss = useCallback(async () => {
    onCssChange(await formatCss(css))
  }, [css, onCssChange])

  const validateCss = useCallback(() => {
    analyze(css)
  }, [css, analyze])

  const onJumpToWarning = useCallback((w: PositionedWarning) => {
    const textarea = textareaRef.current
    if (!textarea || !w.line) return
    const lineHeight = 20
    textarea.scrollTop = (w.line - 1) * lineHeight
    textarea.focus()
  }, [])

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(tab === 'html' ? html : css)
      toast.success(`Copied ${tab.toUpperCase()} to clipboard!`, { position: 'top-center' })
    } catch {
      toast.error('Failed to copy.', { position: 'top-center' })
    }
  }, [tab, html, css])

  const saveToFile = useCallback(() => {
    const content = tab === 'html' ? html : css
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = tab === 'html' ? 'html.txt' : 'css.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [tab, html, css])

  const onScroll = useCallback(() => {
    if (tab !== 'html') return
    const el = textareaRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    if (max > 0) setEditorScrollRatio(el.scrollTop / max)
  }, [tab, setEditorScrollRatio])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="HTML" value="html" />
        <Tab label="CSS" value="css" />
      </Tabs>
      <Divider />

      {/* Editor body */}
      <div style={{ position: 'relative', flex: 1, padding: '8px', minHeight: 0 }}>
        {/* Outlined textarea container */}
        <div
          style={{
            position: 'relative',
            height: '100%',
            border: '1px solid rgba(0,0,0,0.23)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <textarea
            ref={textareaRef}
            value={tab === 'html' ? html : css}
            onChange={(e) =>
              tab === 'html' ? onHtmlChange(e.target.value) : onCssChange(e.target.value)
            }
            onScroll={onScroll}
            placeholder={tab === 'html' ? 'Write HTML here' : 'Write CSS here'}
            spellCheck={false}
            style={{
              width: '100%',
              height: '100%',
              resize: 'none',
              border: 'none',
              outline: 'none',
              fontFamily: "'Lucida Grande', 'Verdana'",
              fontSize: '14px',
              lineHeight: '20px',
              padding: '8px',
              boxSizing: 'border-box',
            }}
          />
          {tab === 'css' && (
            <CssLintOverlay warnings={warnings} rawCss={css} textareaRef={textareaRef} />
          )}
        </div>

        {/* Floating copy button */}
        <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
          <IconButton size="small" onClick={copyToClipboard}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      {/* Warning banner sits between body and footer */}
      {tab === 'css' && status !== 'idle' && (
        <CssWarningBanner
          warnings={warnings}
          visible={status !== 'idle'}
          onDismiss={reset}
          onJump={onJumpToWarning}
        />
      )}

      {/* Footer */}
      <div
        style={{
          flexShrink: 0,
          height: '36px',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '4px 8px',
        }}
      >
        <Button size="small" variant="text" startIcon={<DownloadIcon />} onClick={saveToFile}>
          Export
        </Button>
        {tab === 'css' && (
          <>
            <Button
              size="small"
              variant="text"
              startIcon={<CheckCircleOutlinedIcon />}
              color={LINT_BUTTON_COLOR[status]}
              disabled={isAnalyzing}
              onClick={validateCss}
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
    </div>
  )
}
