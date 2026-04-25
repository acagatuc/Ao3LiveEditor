import { useEffect, useRef, useState } from 'react'
import SplitPanel from '../components/SplitPanel'
import EditorInput from '../editor/EditorInput'
import PreviewFrame from '../editor/PreviewFrame'
import { useEditorState } from '../editor/useEditorState'
import { ScrollStateContext } from '../editor/scrollStateSync'

export default function EditorView() {
  const { html, setHtml, css, setCss, saveToStorage } = useEditorState()
  const [editorScrollRatio, setEditorScrollRatio] = useState(0)
  const [previewScrollRatio, setPreviewScrollRatio] = useState(0)
  const isSyncingScroll = useRef(false)

  useEffect(() => {
    saveToStorage(html, css)
  }, [html, css, saveToStorage])

  return (
    <ScrollStateContext.Provider
      value={{ editorScrollRatio, setEditorScrollRatio, previewScrollRatio, setPreviewScrollRatio, isSyncingScroll }}
    >
      <div style={{ height: '100%' }}>
        <SplitPanel
          leftPanel={<EditorInput html={html} css={css} onHtmlChange={setHtml} onCssChange={setCss} />}
          rightPanel={<PreviewFrame html={html} css={css} />}
        />
      </div>
    </ScrollStateContext.Provider>
  )
}
