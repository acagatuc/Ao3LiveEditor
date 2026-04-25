import { useNavigate, useLocation } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

function NavButton({ label, to }: { label: string; to: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const active = location.pathname === to

  return (
    <Button
      color="inherit"
      onClick={() => navigate(to)}
      sx={{
        borderRadius: 0,
        borderBottom: active ? '2px solid white' : '2px solid transparent',
        opacity: active ? 1 : 0.75,
        fontFamily: "'Lucida Grande', Verdana, sans-serif",
        fontSize: 13,
        textTransform: 'none',
        px: 1.5,
        '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' },
      }}
    >
      {label}
    </Button>
  )
}

export default function AppToolbar() {
  return (
    <AppBar position="static" sx={{ bgcolor: '#7b1d1d', flexShrink: 0 }}>
      <Toolbar>
        <Typography
          variant="h6"
          sx={{ fontFamily: "'Lucida Grande', Verdana, sans-serif", mr: 3 }}
        >
          AO3 Live Editor
        </Typography>

        <NavButton label="HTML/CSS Editor" to="/" />
        <NavButton label="Rich Text Editor" to="/rich-text" />

        <div style={{ flexGrow: 1 }} />

        <Button
          color="inherit"
          href="https://www.w3schools.com/html/"
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<OpenInNewIcon />}
          title="Open W3Schools HTML reference"
          sx={{ fontFamily: "'Lucida Grande', Verdana, sans-serif", fontSize: 13, textTransform: 'none' }}
        >
          HTML Tutorial Site
        </Button>
      </Toolbar>
    </AppBar>
  )
}
