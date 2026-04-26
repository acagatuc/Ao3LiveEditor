import type { Editor } from '@tiptap/react'
import { EditorContent } from '@tiptap/react'
import './EditorPane.css'

interface EditorPaneProps {
  editor: Editor | null
}

export default function EditorPane({ editor }: EditorPaneProps) {
  return (
    <div className="editor-pane__body">
      <EditorContent editor={editor} className="editor-pane__inner" />
    </div>
  )
}
