import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
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

const CHECK_KEYS = [
  'bugReport.checks.siteSkin',
  'bugReport.checks.creatorStyle',
  'bugReport.checks.workSkin',
  'bugReport.checks.extensions',
] as const

export default function BugReportDialog({
  open,
  onClose,
  html,
  css,
  onValidateCss,
}: BugReportDialogProps) {
  const { t } = useTranslation(['editor', 'common'])
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
      setError(t('bugReport.sendFailed'))
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
        {t('bugReport.title')}
        <IconButton size="small" onClick={handleClose} aria-label={t('common:actions.close')} disabled={sending}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {dialogState === 'input' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {t('bugReport.intro')}
            </Typography>
            <div className="bug-report-checks">
              <button
                type="button"
                className="bug-report-checks__toggle"
                onClick={() => setChecksOpen((o) => !o)}
                aria-expanded={checksOpen}
              >
                <span>
                  <span className="bug-report-checks__label">{t('bugReport.checks.label')}</span>
                  <span className="bug-report-checks__summary">
                    {t('bugReport.checks.summary')}
                  </span>
                </span>
                {checksOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </button>
              <Collapse in={checksOpen}>
                <ul className="bug-report-checks__items">
                  <li>
                    <Trans
                      t={t}
                      i18nKey="bugReport.checks.disallowedCss"
                      components={{
                        strong: <strong />,
                        validate: (
                          <button type="button" className="bug-report-checks__link" onClick={handleValidateCss} />
                        ),
                      }}
                    />
                  </li>
                  {CHECK_KEYS.map((key) => (
                    <li key={key}>
                      <Trans t={t} i18nKey={key} components={{ strong: <strong /> }} />
                    </li>
                  ))}
                </ul>
                <p className="bug-report-checks__footer">{t('bugReport.checks.footer')}</p>
              </Collapse>
            </div>
            <TextField
              label={t('bugReport.intentLabel')}
              placeholder={t('bugReport.intentPlaceholder')}
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              required
              fullWidth
              size="small"
              slotProps={{ htmlInput: { maxLength: MAX_INTENT_LENGTH } }}
            />
            <TextField
              label={t('bugReport.descriptionLabel')}
              placeholder={t('bugReport.descriptionPlaceholder')}
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
              label={t('bugReport.siteSkinLabel')}
              placeholder={t('bugReport.siteSkinPlaceholder')}
              helperText={t('bugReport.siteSkinHelper')}
              value={siteSkin}
              onChange={(e) => setSiteSkin(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { maxLength: MAX_SITE_SKIN_LENGTH } }}
            />
            <TextField
              label={t('bugReport.emailLabel')}
              placeholder={t('bugReport.emailPlaceholder')}
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              error={emailInvalid}
              helperText={emailInvalid ? t('bugReport.emailInvalid') : ' '}
              fullWidth
              size="small"
              type="email"
            />
            {!hasCode && (
              <Typography variant="body2" color="text.secondary">
                {t('bugReport.needsCode')}
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
                {sending ? t('bugReport.sending') : t('bugReport.send')}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
            <Typography variant="body1">{t('bugReport.sent')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {contactEmail.trim()
                ? t('bugReport.sentWithEmail', { email: contactEmail.trim() })
                : t('bugReport.sentNoEmail')}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={handleClose}>
                {t('bugReport.done')}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
