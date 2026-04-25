import { useEffect } from 'react'
import SplitPanel from '../components/SplitPanel'
import EditorInput from '../editor/EditorInput'
import PreviewFrame from '../editor/PreviewFrame'
import { useEditorState } from '../editor/useEditorState'
import './EditorView.css'

export default function EditorView() {
  const { html, css, setHtml, setCss, saveToStorage } = useEditorState()

  // Autosave on change
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
