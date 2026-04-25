import type { Editor } from '@tiptap/react'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Tooltip from '@mui/material/Tooltip'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined'
import FormatStrikethroughIcon from '@mui/icons-material/FormatStrikethrough'
import LinkIcon from '@mui/icons-material/Link'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import ImageIcon from '@mui/icons-material/Image'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft'
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter'
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight'
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify'
import FormatTextdirectionLToRIcon from '@mui/icons-material/FormatTextdirectionLToR'
import FormatTextdirectionRToLIcon from '@mui/icons-material/FormatTextdirectionRToL'
import './EditorToolbar.css'

interface EditorToolbarProps {
  editor: Editor | null
}

function ToolBtn({
  title,
  active,
  onClick,
  children,
}: {
  title: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip title={title} placement="top">
      <IconButton
        size="small"
        onClick={onClick}
        sx={{
          borderRadius: 1,
          bgcolor: active ? 'action.selected' : undefined,
          color: active ? 'primary.main' : 'text.secondary',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  )
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null

  // Capture the non-null editor so TypeScript narrows it inside closures.
  const e = editor

  function addLink() {
    const current = e.getAttributes('link').href ?? ''
    const url = window.prompt('Enter URL:', current)
    if (url === null) return
    if (url.trim() === '') {
      e.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      e.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
    }
  }

  function insertImage() {
    const url = window.prompt('Enter image URL:')
    if (!url?.trim()) return
    e.chain().focus().setImage({ src: url.trim() }).run()
  }

  function getHeadingValue(): string {
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      if (e.isActive('heading', { level })) return String(level)
    }
    return 'paragraph'
  }

  function setHeading(value: string) {
    if (value === 'paragraph') {
      e.chain().focus().setParagraph().run()
    } else {
      const level = parseInt(value) as 1 | 2 | 3 | 4 | 5 | 6
      e.chain().focus().setHeading({ level }).run()
    }
  }

  const currentDir =
    e.getAttributes('paragraph').dir ??
    e.getAttributes('heading').dir ??
    null

  const vDivider = <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

  return (
    <div className="editor-toolbar">
      {/* Text formatting */}
      <div className="toolbar-group">
        <ToolBtn title="Bold (Ctrl+B)" active={e.isActive('bold')} onClick={() => e.chain().focus().toggleBold().run()}>
          <FormatBoldIcon fontSize="small" />
        </ToolBtn>
        <ToolBtn title="Italic (Ctrl+I)" active={e.isActive('italic')} onClick={() => e.chain().focus().toggleItalic().run()}>
          <FormatItalicIcon fontSize="small" />
        </ToolBtn>
        <ToolBtn title="Underline (Ctrl+U)" active={e.isActive('underline')} onClick={() => e.chain().focus().toggleUnderline().run()}>
          <FormatUnderlinedIcon fontSize="small" />
        </ToolBtn>
        <ToolBtn title="Strikethrough" active={e.isActive('strike')} onClick={() => e.chain().focus().toggleStrike().run()}>
          <FormatStrikethroughIcon fontSize="small" />
        </ToolBtn>
      </div>

      {vDivider}

      {/* Links & media */}
      <div className="toolbar-group">
        <ToolBtn title="Add / edit link" active={e.isActive('link')} onClick={addLink}>
          <LinkIcon fontSize="small" />
        </ToolBtn>
        <ToolBtn title="Remove link" onClick={() => e.chain().focus().unsetLink().run()}>
          <LinkOffIcon fontSize="small" />
        </ToolBtn>
        <ToolBtn title="Insert image" onClick={insertImage}>
          <ImageIcon fontSize="small" />
        </ToolBtn>
      </div>

      {vDivider}

      {/* Block formatting */}
      <div className="toolbar-group">
        <ToolBtn title="Blockquote" active={e.isActive('blockquote')} onClick={() => e.chain().focus().toggleBlockquote().run()}>
          <FormatQuoteIcon fontSize="small" />
        </ToolBtn>
        <ToolBtn title="Horizontal rule" onClick={() => e.chain().focus().setHorizontalRule().run()}>
          <HorizontalRuleIcon fontSize="small" />
        </ToolBtn>
      </div>

      {vDivider}

      {/* Lists */}
      <div className="toolbar-group">
        <ToolBtn title="Bullet list" active={e.isActive('bulletList')} onClick={() => e.chain().focus().toggleBulletList().run()}>
          <FormatListBulletedIcon fontSize="small" />
        </ToolBtn>
        <ToolBtn title="Numbered list" active={e.isActive('orderedList')} onClick={() => e.chain().focus().toggleOrderedList().run()}>
          <FormatListNumberedIcon fontSize="small" />
        </ToolBtn>
      </div>

      {vDivider}

      {/* Text alignment */}
      <div className="toolbar-group">
        <ToolBtn title="Align left" active={e.isActive({ textAlign: 'left' })} onClick={() => e.chain().focus().setTextAlign('left').run()}>
          <FormatAlignLeftIcon fontSize="small" />
        </ToolBtn>
        <ToolBtn title="Align center" active={e.isActive({ textAlign: 'center' })} onClick={() => e.chain().focus().setTextAlign('center').run()}>
          <FormatAlignCenterIcon fontSize="small" />
        </ToolBtn>
        <ToolBtn title="Align right" active={e.isActive({ textAlign: 'right' })} onClick={() => e.chain().focus().setTextAlign('right').run()}>
          <FormatAlignRightIcon fontSize="small" />
        </ToolBtn>
        <ToolBtn title="Justify" active={e.isActive({ textAlign: 'justify' })} onClick={() => e.chain().focus().setTextAlign('justify').run()}>
          <FormatAlignJustifyIcon fontSize="small" />
        </ToolBtn>
      </div>

      {vDivider}

      {/* Text direction */}
      <div className="toolbar-group">
        <ToolBtn
          title="Left-to-right (LTR)"
          active={currentDir === 'ltr'}
          onClick={() => e.chain().focus().unsetTextDirection().run()}
        >
          <FormatTextdirectionLToRIcon fontSize="small" />
        </ToolBtn>
        <ToolBtn
          title="Right-to-left (RTL)"
          active={currentDir === 'rtl'}
          onClick={() => e.chain().focus().setTextDirection('rtl').run()}
        >
          <FormatTextdirectionRToLIcon fontSize="small" />
        </ToolBtn>
      </div>

      {vDivider}

      {/* Heading dropdown */}
      <div className="toolbar-group">
        <Select
          size="small"
          value={getHeadingValue()}
          onChange={(ev) => setHeading(ev.target.value)}
          sx={{ fontSize: 13, minWidth: 110 }}
        >
          <MenuItem value="paragraph">Paragraph</MenuItem>
          <MenuItem value="1">Heading 1</MenuItem>
          <MenuItem value="2">Heading 2</MenuItem>
          <MenuItem value="3">Heading 3</MenuItem>
          <MenuItem value="4">Heading 4</MenuItem>
          <MenuItem value="5">Heading 5</MenuItem>
          <MenuItem value="6">Heading 6</MenuItem>
        </Select>
      </div>
    </div>
  )
}
