import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import { generateSrcdoc } from '../utilities/generateSrcdoc'
import { getPreview, type GetPreviewResponse } from '../api/previews'
import './SharedPreviewPage.css'

function getDaysRemaining(expiresAt: string): number {
  const now = Date.now()
  const expiry = new Date(expiresAt).getTime()
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
}

export default function SharedPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const [fetchState, setFetchState] = useState<'loading' | 'error' | 'loaded'>('loading')
  const [data, setData] = useState<GetPreviewResponse | null>(null)
  const [hideCreatorStyle, setHideCreatorStyle] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const iframeScrollY = useRef<number>(0)
  const savedScrollY = useRef<number>(0)

  useEffect(() => {
    if (!id) { setFetchState('error'); return }
    getPreview(id)
      .then((d) => { setData(d); setFetchState('loaded') })
      .catch(() => setFetchState('error'))
  }, [id])

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

  const srcdoc = useMemo(() => {
    if (!data) return ''
    return generateSrcdoc({ html: data.html, css: data.css, hideCreatorStyle })
  }, [data, hideCreatorStyle])

  function handleToggleCreatorStyle() {
    savedScrollY.current = iframeScrollY.current
    setHideCreatorStyle((s) => !s)
  }

  if (fetchState === 'loading') {
    return (
      <div className="shared-preview shared-preview--centered">
        <CircularProgress />
      </div>
    )
  }

  if (fetchState === 'error' || !data) {
    return (
      <div className="shared-preview shared-preview--centered">
        <p className="shared-preview__expired-msg">
          This preview has expired or could not be found.
        </p>
        <Link to="/" className="shared-preview__home-link">
          Create your own preview →
        </Link>
      </div>
    )
  }

  const daysRemaining = getDaysRemaining(data.expiresAt)
  const expiryText = daysRemaining < 1 ? 'Expires today' : `Expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`

  return (
    <div className="shared-preview">
      <div className="shared-preview__header">
        <div className="shared-preview__meta">
          <span className={`shared-preview__title${data.title ? '' : ' shared-preview__title--muted'}`}>
            {data.title || 'Shared Preview'}
          </span>
          {data.author && (
            <span className="shared-preview__author">by {data.author}</span>
          )}
        </div>
        <div className="shared-preview__actions">
          <span className="shared-preview__expiry">{expiryText}</span>
          <Button size="small" variant="outlined" onClick={handleToggleCreatorStyle}>
            {hideCreatorStyle ? "Show Creator's Style" : "Hide Creator's Style"}
          </Button>
        </div>
      </div>
      <Divider />
      <div className="shared-preview__body">
        <iframe
          ref={iframeRef}
          className="shared-preview__frame"
          sandbox="allow-scripts"
          srcDoc={srcdoc}
          title={data.title || 'Shared Preview'}
        />
      </div>
    </div>
  )
}
