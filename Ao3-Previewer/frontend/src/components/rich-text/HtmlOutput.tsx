import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import './HtmlOutput.css'

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
  const { t } = useTranslation('richText')
  const formattedHtml = useMemo(() => formatHtmlOutput(html), [html])
  const isEmpty = html.replace(/<[^>]*>/g, '').trim() === ''

  return (
    <div className="html-output__body">
      <div className="html-output__code-box">
        <pre className="html-output__code">
          {isEmpty ? (
            <span className="html-output__empty">{t('htmlOutputEmpty')}</span>
          ) : (
            formattedHtml
          )}
        </pre>
      </div>
    </div>
  )
}
