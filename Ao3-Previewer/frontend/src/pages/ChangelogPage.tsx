import { useEffect } from 'react'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { CHANGELOG, type ChangeType } from '../data/changelog-data'
import { UPCOMING, type UpcomingStatus } from '../data/upcoming-data'
import { markChangelogSeen } from '../hooks/useChangelogUnseen'
import './ChangelogPage.css'

const TYPE_LABEL: Record<ChangeType, string> = {
  added: 'Added',
  fixed: 'Fixed',
  improved: 'Improved',
  removed: 'Removed',
}

const TYPE_COLOR: Record<ChangeType, 'success' | 'error' | 'info' | 'warning'> = {
  added: 'success',
  fixed: 'error',
  improved: 'info',
  removed: 'warning',
}

const UPCOMING_STATUS_LABEL: Record<UpcomingStatus, string> = {
  'in-progress': 'In progress',
  planned: 'Planned',
}

const UPCOMING_STATUSES: UpcomingStatus[] = ['in-progress', 'planned']

export default function ChangelogPage() {
  useEffect(() => {
    markChangelogSeen()
  }, [])

  return (
    <div className="changelog-page">
      <div className="changelog-layout">
        <div className="changelog-main">
          <Typography variant="h4" component="h1" gutterBottom>
            Changelog
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            A history of what's changed in FicFormatter.
          </Typography>

          <div className="changelog-list">
            {CHANGELOG.map((release) => (
              <div key={release.version} className="changelog-release">
                <div className="changelog-release__header">
                  <Typography variant="h5" component="h2" className="changelog-release__title">
                    {release.date}
                    <span className="changelog-release__version">v{release.version}</span>
                  </Typography>
                  <Typography color="text.secondary" className="changelog-release__summary">
                    {release.title}
                  </Typography>
                </div>
                <ul className="changelog-release__changes">
                  {release.changes.map((change, i) => (
                    <li key={i} className="changelog-release__change">
                      <Chip
                        label={TYPE_LABEL[change.type]}
                        color={TYPE_COLOR[change.type]}
                        size="small"
                        className="changelog-release__chip"
                      />
                      <span>{change.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="changelog-upcoming">
          <Typography variant="h6" component="h2" gutterBottom>
            Upcoming
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
            What we're working on and thinking about next.
          </Typography>

          {UPCOMING_STATUSES.map((status) => {
            const items = UPCOMING.filter((item) => item.status === status)
            if (items.length === 0) return null
            return (
              <div key={status} className="changelog-upcoming__group">
                <Typography variant="overline" className="changelog-upcoming__group-label">
                  {UPCOMING_STATUS_LABEL[status]}
                </Typography>
                <ul className="changelog-upcoming__items">
                  {items.map((item, i) => (
                    <li key={i}>{item.description}</li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
