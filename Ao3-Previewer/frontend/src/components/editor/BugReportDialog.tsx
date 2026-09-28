import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import CloseIcon from '@mui/icons-material/Close'
import { createBugReport } from '../../api/bugReports'
import { CHANGELOG } from '../../data/changelog-data'
import './BugReportDialog.css'

interface BugReportDialogProps {
  open: boolean
  onClose: () => void
  html: string
  css: string
  onValidateCss: () => void
}

type DialogState = 'input' | 'sent'

const MAX_DESCRIPTION_LENGTH = 2000
const MAX_INTENT_LENGTH = 500
const MAX_SITE_SKIN_LENGTH = 200
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function BugReportDialog({
  open,
  onClose,
  html,
  css,
  onValidateCss,
}: BugReportDialogProps) {
  const [dialogState, setDialogState] = useState<DialogState>('input')
  const [intent, setIntent] = useState('')
  const [description, setDescription] = useState('')
  const [siteSkin, setSiteSkin] = useState('')
  const [checksOpen, setChecksOpen] = useState(false)
  const [contactEmail, setContactEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const hasCode = html.trim() !== '' || css.trim() !== ''
  const emailInvalid = contactEmail.trim() !== '' && !EMAIL_REGEX.test(contactEmail.trim())
  const canSend = hasCode && intent.trim() !== '' && description.trim() !== '' && !emailInvalid && !sending

  // Start each opening with a fresh form. Resetting on open rather than on a timer after close
  // means reopening quickly can't have a pending reset wipe what the user is typing.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setDialogState('input')
      setIntent('')
      setDescription('')
      setSiteSkin('')
      setChecksOpen(false)
      setContactEmail('')
      setError('')
    }
  }

  function handleClose() {
    // Closing mid-send would hide whether the report went through.
    if (sending) return
    onClose()
  }

  function handleValidateCss() {
    if (sending) return
    handleClose()
    onValidateCss()
  }

  async function handleSend() {
    setSending(true)
    setError('')
    try {
      await createBugReport({
        html,
        css,
        intent: intent.trim(),
        description: description.trim(),
        siteSkin: siteSkin.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        appVersion: CHANGELOG[0]?.version,
      })
      setDialogState('sent')
    } catch {
      setError('Something went wrong sending your report. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
        Looks different on AO3?
        <IconButton size="small" onClick={handleClose} aria-label="close" disabled={sending}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {dialogState === 'input' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              If your work shows up differently on AO3 than it does in this preview, let me know
              here. Your current HTML and CSS are sent along with the report, so there's nothing
              else you need to copy.
            </Typography>
            <div className="bug-report-checks">
              <button
                type="button"
                className="bug-report-checks__toggle"
                onClick={() => setChecksOpen((o) => !o)}
                aria-expanded={checksOpen}
              >
                <span>
                  <span className="bug-report-checks__label">Worth a quick check first</span>
                  <span className="bug-report-checks__summary">
                    A work can look different on AO3 and in the preview (in either direction)
                    without anything being broken. These are the usual reasons.
                  </span>
                </span>
                {checksOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </button>
              <Collapse in={checksOpen}>
                <ul className="bug-report-checks__items">
                  <li>
                    <strong>CSS AO3 doesn't allow.</strong> The preview shows all of your CSS, but
                    AO3 removes anything outside its rules.{' '}
                    <button type="button" className="bug-report-checks__link" onClick={handleValidateCss}>
                      Validate CSS
                    </button>{' '}
                    to see what AO3 will strip. A strict mode that previews only what AO3 keeps
                    is coming soon.
                  </li>
                  <li>
                    <strong>Your site skin.</strong> Custom and dark-mode skins can override colors
                    and backgrounds. Try switching to Default under Preferences → Skins.
                  </li>
                  <li>
                    <strong>Creator's style.</strong> If "Hide Creator's Style" is on for the work,
                    or "Hide work skins" is on in your preferences, work skins won't show.
                  </li>
                  <li>
                    <strong>The work skin itself.</strong> Make sure it's selected on the work
                    (Edit Work → Select Work Skin).
                  </li>
                  <li>
                    <strong>Browser extensions,</strong> like dark mode or reader-view tools.
                  </li>
                </ul>
                <p className="bug-report-checks__footer">
                  Still looks different? Send it anyway. I'd much rather get a report that turns
                  out to be nothing than miss a real bug.
                </p>
              </Collapse>
            </div>
            <TextField
              label="Template URL, or what you're trying to make"
              placeholder="e.g. a link to the skin you're using, or &quot;a fake text message thread&quot;"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              required
              fullWidth
              size="small"
              slotProps={{ htmlInput: { maxLength: MAX_INTENT_LENGTH } }}
            />
            <TextField
              label="What looks different between AO3 and the preview?"
              placeholder="e.g. the message bubbles are gray here but white on AO3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              fullWidth
              multiline
              minRows={3}
              size="small"
              slotProps={{ htmlInput: { maxLength: MAX_DESCRIPTION_LENGTH } }}
            />
            <TextField
              label="Your AO3 site skin (optional)"
              placeholder="e.g. Default, Reversi, or the name of a custom skin"
              helperText="If you're not sure, it's probably Default"
              value={siteSkin}
              onChange={(e) => setSiteSkin(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { maxLength: MAX_SITE_SKIN_LENGTH } }}
            />
            <TextField
              label="Your email (optional)"
              placeholder="Only if you'd like a reply"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              error={emailInvalid}
              helperText={emailInvalid ? 'That doesn\'t look like an email address' : ' '}
              fullWidth
              size="small"
              type="email"
            />
            {!hasCode && (
              <Typography variant="body2" color="text.secondary">
                Add the HTML or CSS that's causing the problem to the editor first.
              </Typography>
            )}
            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSend}
                disabled={!canSend}
                startIcon={sending ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {sending ? 'Sending...' : 'Send Report'}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
            <Typography variant="body1">Thanks! Your report was sent.</Typography>
            <Typography variant="body2" color="text.secondary">
              {contactEmail.trim()
                ? `A confirmation is on its way to ${contactEmail.trim()}. I'll reply there if I have questions or a fix.`
                : "I'll look into it. You don't need to do anything else."}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={handleClose}>
                Done
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
