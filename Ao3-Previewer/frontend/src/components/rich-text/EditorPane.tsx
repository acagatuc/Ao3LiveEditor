import type { Editor } from '@tiptap/react'
import { EditorContent } from '@tiptap/react'
import Divider from '@mui/material/Divider'
import EditorToolbar from './EditorToolbar'
import './EditorPane.css'

interface EditorPaneProps {
  editor: Editor | null
}

export default function EditorPane({ editor }: EditorPaneProps) {
  return (
    <div className="editor-pane">
      <EditorToolbar editor={editor} />
      <Divider />
      <div className="editor-pane__body">
        <EditorContent editor={editor} className="editor-pane__inner" />
      </div>
    </div>
  )
}
