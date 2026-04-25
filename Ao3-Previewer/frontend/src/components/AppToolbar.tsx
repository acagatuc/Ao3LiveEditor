import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

export default function AppToolbar() {
  return (
    <AppBar position="static" sx={{ bgcolor: '#7b1d1d', flexShrink: 0 }}>
      <Toolbar>
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, fontFamily: "'Lucida Grande', Verdana, sans-serif" }}
        >
          Live HTML Editor
        </Typography>
        <Button
          color="inherit"
          href="https://www.w3schools.com/html/"
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<OpenInNewIcon />}
          title="Open W3Schools HTML reference"
        >
          HTML Tutorial Site
        </Button>
      </Toolbar>
    </AppBar>
  )
}
