import { useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'

const STORAGE_KEY = 'ao3-bug-report-notice-seen'

function readSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true')
  } catch (err) {
    console.warn('Failed to save bug report notice state:', err)
  }
}

interface BugReportNoticeProps {
  onReport: () => void
}

/** One-time pointer to the Report a problem button, shown on the first visit to the HTML/CSS editor. */
export default function BugReportNotice({ onReport }: BugReportNoticeProps) {
  const [open, setOpen] = useState(() => !readSeen())

  function handleClose() {
    markSeen()
    setOpen(false)
  }

  function handleReport() {
    handleClose()
    onReport()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Looks different on AO3?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          If your work shows up differently on AO3 than it does in the preview, click{' '}
          <strong>Report a problem</strong> above the preview.
        </Typography>
        <Typography variant="body2">
          It sends me your HTML and CSS along with a short note, so I can see exactly what went
          wrong and fix it. You don't need to do anything else.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReport}>Report something now</Button>
        <Button onClick={handleClose} variant="contained">
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  )
}
