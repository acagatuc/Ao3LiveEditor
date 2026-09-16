import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import SplitPanel from '../components/SplitPanel'
import EditorInput from '../components/editor/EditorInput'
import PreviewFrame from '../components/editor/PreviewFrame'
import SaveDraftDialog from '../components/editor/SaveDraftDialog'
import type { SavedDraftResult } from '../components/editor/SaveDraftDialog'
import { useEditorState } from '../hooks/useEditorState'
import { useDraftsIndexContext } from '../contexts/draftsIndexContext'
import type { GetDraftResponse } from '../api/drafts'
import './EditorViewPage.css'

export default function EditorViewPage() {
  const { html, css, setHtml, setCss, saveToStorage } = useEditorState()
  const location = useLocation()
  const draftsIndex = useDraftsIndexContext()
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const lastLoadedKeyRef = useRef<string | null>(null)

  const currentDraftTitle = draftsIndex.entries.find((e) => e.id === currentDraftId)?.title ?? ''

  // One-time hand-off: a css value passed via router state (e.g. from Workskins), on mount only.
  useEffect(() => {
    if (location.state?.css) {
      setCss(location.state.css)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Hand-off from the header's "My Drafts" navigation. Keyed on location.key (unique per
  // navigation) rather than running once on mount, so opening a second draft while one is
  // already loaded — a navigation to the same route with new state — still fires.
  useEffect(() => {
    const draftToLoad = location.state?.draftToLoad as GetDraftResponse | undefined
    if (!draftToLoad || lastLoadedKeyRef.current === location.key) return
    lastLoadedKeyRef.current = location.key
    setHtml(draftToLoad.html)
    setCss(draftToLoad.css ?? '')
    setCurrentDraftId(draftToLoad.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  useEffect(() => {
    saveToStorage(html, css)
  }, [html, css, saveToStorage])

  function handleDraftSaved({ id, title, updatedAt }: SavedDraftResult) {
    setCurrentDraftId(id)
    draftsIndex.upsert({ id, title, updatedAt, payloadType: 'html-css' })
  }

  return (
    <div className="editor-view">
      <SplitPanel
        left={
          <EditorInput
            html={html}
            css={css}
            onHtmlChange={setHtml}
            onCssChange={setCss}
            onOpenSaveDraft={() => setSaveDialogOpen(true)}
          />
        }
        right={<PreviewFrame html={html} css={css} />}
      />
      <SaveDraftDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        payloadType="html-css"
        html={html}
        css={css}
        currentDraft={currentDraftId ? { id: currentDraftId, title: currentDraftTitle } : null}
        onSaved={handleDraftSaved}
      />
    </div>
  )
}
