import { useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import Button from '@mui/material/Button'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import './HtmlOutput.css'

const AO3_TAGS = [
  'a','abbr','acronym','address','b','big','blockquote','br','caption','center',
  'cite','code','col','colgroup','dd','del','dfn','div','dl','dt','em',
  'h1','h2','h3','h4','h5','h6','hr','i','img','ins','kbd','li','ol','p',
  'pre','q','rp','rt','ruby','s','samp','small','span','strike','strong',
  'sub','sup','table','tbody','td','tfoot','th','thead','tr','tt','u','ul','var',
]

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: AO3_TAGS,
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'dir', 'target', 'rel', 'align', 'width', 'height'],
  })
}

const BLOCK_CLOSE = /(<\/(?:p|h[1-6]|blockquote|ul|ol|li|div|pre|table|tbody|thead|tfoot|tr|th|td)>)/gi

function formatHtmlOutput(html: string): string {
  return html
    .replace(BLOCK_CLOSE, '$1\n')
    .replace(/<hr\s*\/?>/gi, '<hr>\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

interface HtmlOutputProps {
  html: string
}

export default function HtmlOutput({ html }: HtmlOutputProps) {
  const [copied, setCopied] = useState(false)

  const sanitizedHtml = useMemo(() => sanitize(html), [html])
  const formattedHtml = useMemo(() => formatHtmlOutput(sanitizedHtml), [sanitizedHtml])

  const isEmpty = sanitizedHtml.replace(/<[^>]*>/g, '').trim() === ''

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(sanitizedHtml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="html-output">
      <div className="html-output__header">
        <span className="html-output__title">HTML Output</span>
      </div>

      <div className="html-output__body">
        <div className="html-output__code-box">
          <pre className="html-output__code">
            {isEmpty ? (
              <span className="html-output__empty">Your HTML will appear here as you type.</span>
            ) : (
              formattedHtml
            )}
          </pre>
        </div>
      </div>

      <div className="html-output__footer">
        <Button
          size="small"
          variant="text"
          startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
          onClick={copyHtml}
          color={copied ? 'success' : 'inherit'}
        >
          {copied ? 'Copied!' : 'Copy HTML'}
        </Button>
      </div>
    </div>
  )
}
