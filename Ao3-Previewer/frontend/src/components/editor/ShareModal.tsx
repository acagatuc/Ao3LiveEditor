import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { createPreview } from '../../api/previews'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  html: string
  css: string
}

type ModalState = 'input' | 'link'

export default function ShareModal({ open, onClose, html, css }: ShareModalProps) {
  const { t } = useTranslation(['editor', 'common'])
  const [modalState, setModalState] = useState<ModalState>('input')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const { copyState, copy, reset: resetCopy } = useCopyToClipboard()

  function handleClose() {
    onClose()
    // Reset state after close animation completes
    setTimeout(() => {
      setModalState('input')
      setTitle('')
      setAuthor('')
      setError('')
      setShareUrl('')
      resetCopy()
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
      setError(t('share.failed'))
    } finally {
      setGenerating(false)
    }
  }

  function handleCopyLink() {
    copy(shareUrl)
  }

  function handleShareAnother() {
    setModalState('input')
    setTitle('')
    setAuthor('')
    setError('')
    setShareUrl('')
    resetCopy()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
        {t('share.title')}
        <IconButton size="small" onClick={handleClose} aria-label={t('common:actions.close')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {modalState === 'input' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
            <TextField
              label={t('share.titleLabel')}
              placeholder={t('share.titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label={t('share.authorLabel')}
              placeholder={t('share.authorPlaceholder')}
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
                {generating ? t('share.generating') : t('share.generate')}
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
                startIcon={
                  copyState === 'copied' ? <CheckIcon /> : copyState === 'failed' ? <ErrorOutlineIcon /> : <ContentCopyIcon />
                }
                onClick={handleCopyLink}
                color={copyState === 'copied' ? 'success' : copyState === 'failed' ? 'error' : 'primary'}
                sx={{ flexShrink: 0 }}
              >
                {copyState === 'copied'
                  ? t('common:actions.copied')
                  : copyState === 'failed'
                    ? t('common:actions.copyFailed')
                    : t('share.copyLink')}
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {t('share.expires')}
            </Typography>
            <Button variant="text" onClick={handleShareAnother} sx={{ alignSelf: 'flex-start', p: 0 }}>
              {t('share.shareAnother')}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
