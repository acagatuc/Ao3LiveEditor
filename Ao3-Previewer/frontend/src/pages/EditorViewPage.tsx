import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import SplitPanel from '../components/SplitPanel'
import EditorInput from '../components/editor/EditorInput'
import PreviewFrame from '../components/editor/PreviewFrame'
import { useEditorState } from '../hooks/useEditorState'
import './EditorViewPage.css'

export default function EditorViewPage() {
  const { html, css, setHtml, setCss, saveToStorage } = useEditorState()
  const location = useLocation()

  useEffect(() => {
    if (location.state?.css) {
      setCss(location.state.css)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    saveToStorage(html, css)
  }, [html, css, saveToStorage])

  return (
    <div className="editor-view">
      <SplitPanel
        left={
          <EditorInput
            html={html}
            css={css}
            onHtmlChange={setHtml}
            onCssChange={setCss}
          />
        }
        right={<PreviewFrame html={html} css={css} />}
      />
    </div>
  )
}
