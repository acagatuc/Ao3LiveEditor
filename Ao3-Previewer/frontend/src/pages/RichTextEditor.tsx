import { useState } from 'react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import SplitPanel from '../components/SplitPanel'
import EditorPane from '../components/rich-text/EditorPane'
import HtmlOutput from '../components/rich-text/HtmlOutput'
import './RichTextEditor.css'

const STORAGE_KEY = 'ao3-rich-text-state'

function loadContent(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function saveContent(html: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, html)
  } catch {
    // ignore
  }
}

const STRIP_LTR = /\s+dir="ltr"/g

export default function RichTextEditor() {
  const [html, setHtml] = useState(() => loadContent().replace(STRIP_LTR, ''))

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    textDirection: 'ltr',
    content: loadContent(),
    onUpdate({ editor }) {
      const raw = editor.getHTML()
      saveContent(raw)
      setHtml(raw.replace(STRIP_LTR, ''))
    },
  })

  return (
    <div className="rich-text-page">
      <SplitPanel
        left={<EditorPane editor={editor} />}
        right={<HtmlOutput html={html} />}
      />
    </div>
  )
}
