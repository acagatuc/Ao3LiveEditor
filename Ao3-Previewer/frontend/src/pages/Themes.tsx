import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import { useThemeMode } from '../theme/ThemeContext'

export default function ThemesPage() {
  const { mode, setMode } = useThemeMode()

  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        p: 4,
        boxSizing: 'border-box',
      }}
    >
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Appearance
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Customize how FicFormatter looks. Your preferences are saved locally.
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Theme
          </Typography>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode) setMode(newMode)
            }}
            aria-label="theme mode"
          >
            <ToggleButton value="light" aria-label="light mode">
              <LightModeIcon sx={{ mr: 1, fontSize: 18 }} />
              Light
            </ToggleButton>
            <ToggleButton value="dark" aria-label="dark mode">
              <DarkModeIcon sx={{ mr: 1, fontSize: 18 }} />
              Dark
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        <Paper sx={{ p: 3, mb: 3, opacity: 0.5, pointerEvents: 'none', userSelect: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="h6">Presets</Typography>
            <Chip label="Coming soon" size="small" />
          </Box>
          <Typography color="text.secondary" variant="body2">
            Choose from named themes beyond light and dark.
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, opacity: 0.5, pointerEvents: 'none', userSelect: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="h6">Custom CSS</Typography>
            <Chip label="Coming soon" size="small" />
          </Box>
          <Typography color="text.secondary" variant="body2">
            Write your own CSS to fully customize the app UI.
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}
