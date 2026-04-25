import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import AppToolbar from './components/AppToolbar'
import EditorView from './views/EditorView'

const theme = createTheme({
  palette: {
    primary: {
      main: '#7b1d1d',
      contrastText: '#ffffff',
    },
  },
  typography: {
    fontFamily: "'Lucida Grande', 'Verdana', sans-serif",
  },
})

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <AppToolbar />
        <EditorView />
      </div>
    </ThemeProvider>
  )
}
