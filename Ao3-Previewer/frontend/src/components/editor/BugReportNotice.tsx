import { useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import { Trans, useTranslation } from 'react-i18next'

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
  const { t } = useTranslation('editor')
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('bugReportNotice.title')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          <Trans t={t} i18nKey="bugReportNotice.body" components={{ strong: <strong /> }} />
        </Typography>
        <Typography variant="body2">
          {t('bugReportNotice.body2')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReport}>{t('bugReportNotice.reportNow')}</Button>
        <Button onClick={handleClose} variant="contained">
          {t('bugReportNotice.gotIt')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
