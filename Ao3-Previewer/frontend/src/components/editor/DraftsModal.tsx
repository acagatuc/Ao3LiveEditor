import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import { getDraft, updateDraft, deleteDraft } from '../../api/drafts'
import type { GetDraftResponse } from '../../api/drafts'
import type { UseDraftsIndexReturn } from '../../hooks/useDraftsIndex'
import { formatRelativeTime, payloadTypeLabel, payloadTypeColor, payloadTypeIcon } from '../../utilities/draftDisplay'

interface DraftsModalProps {
  open: boolean
  onClose: () => void
  draftsIndex: UseDraftsIndexReturn
  onOpen: (draft: GetDraftResponse) => void
}

export default function DraftsModal({ open, onClose, draftsIndex, onOpen }: DraftsModalProps) {
  const { entries, upsert, remove } = draftsIndex
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [savingRenameId, setSavingRenameId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleOpen(id: string) {
    setError('')
    setOpeningId(id)
    try {
      const draft = await getDraft(id)
      onOpen(draft)
    } catch {
      setError('Failed to open that draft. It may have expired.')
    } finally {
      setOpeningId(null)
    }
  }

  function startRename(id: string, currentTitle: string) {
    setError('')
    setRenamingId(id)
    setRenameValue(currentTitle)
  }

  async function confirmRename(id: string) {
    setError('')
    setSavingRenameId(id)
    try {
      const draft = await getDraft(id)
      const { updatedAt } = await updateDraft(id, {
        payloadType: draft.payloadType,
        html: draft.html,
        css: draft.css,
        title: renameValue,
      })
      upsert({ id, title: renameValue, updatedAt, payloadType: draft.payloadType })
      setRenamingId(null)
    } catch {
      setError('Failed to rename that draft.')
    } finally {
      setSavingRenameId(null)
    }
  }

  async function confirmDelete(id: string) {
    setError('')
    setDeletingId(id)
    try {
      await deleteDraft(id)
      remove(id)
      setConfirmDeleteId(null)
    } catch {
      setError('Failed to delete that draft.')
    } finally {
      setDeletingId(null)
    }
  }

  function handleClose() {
    setRenamingId(null)
    setConfirmDeleteId(null)
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
        My Drafts
        <IconButton size="small" onClick={handleClose} aria-label="close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        {entries.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No saved drafts yet. Use "Save Draft" to save your work here.
          </Typography>
        ) : (
          <List disablePadding>
            {entries.map((entry, i) => {
              const Icon = payloadTypeIcon(entry.payloadType)
              const color = payloadTypeColor(entry.payloadType)
              return (
              <Box key={entry.id}>
                {i > 0 && <Divider />}
                <ListItem disableGutters sx={{ py: 1.5, gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: `${color}.main`, width: 40, height: 40 }}>
                    <Icon fontSize="small" />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {renamingId === entry.id ? (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          size="small"
                          autoFocus
                          fullWidth
                        />
                        <IconButton
                          size="small"
                          onClick={() => confirmRename(entry.id)}
                          disabled={savingRenameId === entry.id}
                          aria-label="confirm rename"
                        >
                          {savingRenameId === entry.id ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
                        </IconButton>
                      </Box>
                    ) : (
                      <>
                        <Typography variant="body1" noWrap>
                          {entry.title || 'Untitled'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                          <Chip label={payloadTypeLabel(entry.payloadType)} size="small" color={color} variant="outlined" />
                          <Typography variant="body2" color="text.secondary">
                            Edited {formatRelativeTime(entry.updatedAt)}
                          </Typography>
                        </Box>
                      </>
                    )}

                    {confirmDeleteId === entry.id && (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                        <Typography variant="body2">Delete this draft?</Typography>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => confirmDelete(entry.id)}
                          disabled={deletingId === entry.id}
                        >
                          {deletingId === entry.id ? <CircularProgress size={14} /> : 'Delete'}
                        </Button>
                        <Button size="small" onClick={() => setConfirmDeleteId(null)}>
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {renamingId !== entry.id && confirmDeleteId !== entry.id && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                      <Button
                        size="small"
                        onClick={() => handleOpen(entry.id)}
                        disabled={openingId === entry.id}
                      >
                        {openingId === entry.id ? <CircularProgress size={14} /> : 'Open'}
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => startRename(entry.id, entry.title)}
                        aria-label="rename"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setConfirmDeleteId(entry.id)}
                        aria-label="delete"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </ListItem>
              </Box>
              )
            })}
          </List>
        )}
      </DialogContent>
    </Dialog>
  )
}
