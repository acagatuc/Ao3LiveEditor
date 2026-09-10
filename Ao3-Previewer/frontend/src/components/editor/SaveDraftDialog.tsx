import { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import CloseIcon from '@mui/icons-material/Close'
import { createDraft, updateDraft } from '../../api/drafts'
import type { DraftPayloadType } from '../../api/drafts'

export interface SavedDraftResult {
  id: string
  title: string
  updatedAt: string
}

interface SaveDraftDialogProps {
  open: boolean
  onClose: () => void
  payloadType: DraftPayloadType
  html: string
  css?: string
  currentDraft: { id: string; title: string } | null
  onSaved: (result: SavedDraftResult) => void
}

export default function SaveDraftDialog({
  open,
  onClose,
  payloadType,
  html,
  css,
  currentDraft,
  onSaved,
}: SaveDraftDialogProps) {
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Resets the form each time the dialog opens — SaveDraftDialog is always mounted by its
  // parent (only the `open` prop toggles), so state would otherwise persist stale across uses.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(currentDraft?.title ?? '')
      setError('')
    }
  }, [open, currentDraft])

  async function handleSave(saveAsNew: boolean) {
    setSaving(true)
    setError('')
    try {
      if (currentDraft && !saveAsNew) {
        const { updatedAt } = await updateDraft(currentDraft.id, { payloadType, html, css, title })
        onSaved({ id: currentDraft.id, title, updatedAt })
      } else {
        const { id, updatedAt } = await createDraft({ payloadType, html, css, title })
        onSaved({ id, title, updatedAt })
      }
      onClose()
    } catch {
      setError('Failed to save draft. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
        Save Draft
        <IconButton size="small" onClick={onClose} disabled={saving} aria-label="close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <TextField
          label="Title"
          placeholder="Untitled"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          size="small"
          autoFocus
          sx={{ mt: 0.5 }}
        />
        {currentDraft && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            This content is linked to an existing draft. "Update" overwrites it — "Save as New"
            keeps the original untouched and creates a separate copy.
          </Typography>
        )}
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        {currentDraft && (
          <Button onClick={() => handleSave(true)} disabled={saving}>
            {saving ? <CircularProgress size={16} /> : 'Save as New'}
          </Button>
        )}
        <Button variant="contained" onClick={() => handleSave(false)} disabled={saving}>
          {saving ? <CircularProgress size={16} /> : currentDraft ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
