import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { CHANGELOG, type ChangeType } from '../data/changelog-data'
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

export default function ChangelogPage() {
  return (
    <div className="changelog-page">
      <div className="changelog-content">
        <Typography variant="h4" component="h1" gutterBottom>
          Changelog
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          A history of what's changed in FicFormatter.
        </Typography>

        <div className="changelog-list">
          {CHANGELOG.map((release) => (
            <div key={release.date} className="changelog-release">
              <div className="changelog-release__meta">
                <span className="changelog-release__date">{release.date}</span>
              </div>
              <div className="changelog-release__body">
                <Typography variant="h6" component="h2" className="changelog-release__title">
                  {release.title}
                </Typography>
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
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
