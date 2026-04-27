import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import { createPreview } from '../api/previews'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  html: string
  css: string
}

type ModalState = 'input' | 'link'

export default function ShareModal({ open, onClose, html, css }: ShareModalProps) {
  const [modalState, setModalState] = useState<ModalState>('input')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)

  function handleClose() {
    onClose()
    // Reset state after close animation completes
    setTimeout(() => {
      setModalState('input')
      setTitle('')
      setAuthor('')
      setError('')
      setShareUrl('')
      setCopied(false)
    }, 200)
  }

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    try {
      const data = await createPreview({ html, css, title, author })
      setShareUrl(`${window.location.origin}/preview/${data.id}`)
      setModalState('link')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  function handleShareAnother() {
    setModalState('input')
    setTitle('')
    setAuthor('')
    setError('')
    setShareUrl('')
    setCopied(false)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
        Share Preview
        <IconButton size="small" onClick={handleClose} aria-label="close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {modalState === 'input' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
            <TextField
              label="Title (optional)"
              placeholder="e.g. The Long Way Home"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Author (optional)"
              placeholder="e.g. your AO3 username"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              fullWidth
              size="small"
            />
            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? 'Generating...' : 'Generate Link'}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                value={shareUrl}
                fullWidth
                size="small"
                slotProps={{ input: { readOnly: true } }}
              />
              <Button
                variant="outlined"
                startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                onClick={handleCopyLink}
                color={copied ? 'success' : 'primary'}
                sx={{ flexShrink: 0 }}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary">
              This link expires in 7 days
            </Typography>
            <Button variant="text" onClick={handleShareAnother} sx={{ alignSelf: 'flex-start', p: 0 }}>
              Share another
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
