import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import AppToolbar from './components/AppToolbar'
import EditorView from './views/EditorView'

const theme = createTheme({
  palette: {
    mode: 'light',
  },
})

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <AppToolbar />
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <EditorView />
        </Box>
      </Box>
      <ToastContainer autoClose={3000} />
    </ThemeProvider>
  )
}
