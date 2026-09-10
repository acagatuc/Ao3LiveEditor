import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import Divider from '@mui/material/Divider'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import DraftsModal from './editor/DraftsModal'
import { useDraftsIndexContext } from '../contexts/draftsIndexContext'
import { getDraft } from '../api/drafts'
import type { GetDraftResponse } from '../api/drafts'
import { editorPathFor, payloadTypeLabel, payloadTypeColor, payloadTypeIcon, formatRelativeTime } from '../utilities/draftDisplay'

const RECENT_LIMIT = 5

export default function DraftsHeaderMenu() {
  const navigate = useNavigate()
  const draftsIndex = useDraftsIndexContext()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [openingId, setOpeningId] = useState<string | null>(null)

  const recent = draftsIndex.entries.slice(0, RECENT_LIMIT)

  function goToDraft(draft: GetDraftResponse) {
    navigate(editorPathFor(draft.payloadType), { state: { draftToLoad: draft } })
    setAnchorEl(null)
    setModalOpen(false)
  }

  async function handleSelectRecent(id: string) {
    setOpeningId(id)
    try {
      const draft = await getDraft(id)
      goToDraft(draft)
    } catch {
      // Draft may have expired — leave the menu open so the user can try another.
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <>
      <Button
        color="inherit"
        size="small"
        variant="text"
        startIcon={<FolderOpenIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          fontFamily: "'Lucida Grande', Verdana, sans-serif",
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        My Drafts
      </Button>

      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        {recent.length === 0 ? (
          <MenuItem disabled>No saved drafts yet</MenuItem>
        ) : (
          recent.map((entry) => {
            const Icon = payloadTypeIcon(entry.payloadType)
            return (
              <MenuItem
                key={entry.id}
                onClick={() => handleSelectRecent(entry.id)}
                disabled={openingId === entry.id}
              >
                <ListItemIcon sx={{ color: `${payloadTypeColor(entry.payloadType)}.main` }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={entry.title || 'Untitled'}
                  secondary={`${payloadTypeLabel(entry.payloadType)} · Edited ${formatRelativeTime(entry.updatedAt)}`}
                />
              </MenuItem>
            )
          })
        )}
        <Divider />
        <MenuItem
          onClick={() => {
            setModalOpen(true)
            setAnchorEl(null)
          }}
        >
          View All Drafts…
        </MenuItem>
      </Menu>

      <DraftsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        draftsIndex={draftsIndex}
        onOpen={goToDraft}
      />
    </>
  )
}
