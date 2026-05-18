import { createContext, useContext, useState, type ReactNode } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import { buildTheme } from './buildTheme'

type ThemeMode = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const STORAGE_KEY = 'ficformatter-theme-mode'

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  setMode: () => {},
  toggleMode: () => {},
})

function getInitialMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

export function FicFormatterThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getInitialMode)

  function setMode(newMode: ThemeMode) {
    setModeState(newMode)
    localStorage.setItem(STORAGE_KEY, newMode)
  }

  function toggleMode() {
    setMode(mode === 'light' ? 'dark' : 'light')
  }

  const theme = buildTheme(mode)
  const isDark = mode === 'dark'

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            ':root': {
              '--ff-color-primary': '#7b1d1d',
              // Reversi-inspired dark palette: #333 base, #2a2a2a surfaces, #222 deep
              '--ff-color-bg-default': isDark ? '#333333' : '#e9e8e8',
              '--ff-color-bg-paper': isDark ? '#2a2a2a' : '#ffffff',
              '--ff-color-bg-subtle': isDark ? '#222222' : '#fafafa',
              '--ff-color-bg-code': isDark ? '#222222' : '#f5f5f5',
              '--ff-color-text-primary': isDark ? '#eeeeee' : '#2a2a2a',
              '--ff-color-text-secondary': isDark ? '#999999' : '#555555',
              '--ff-color-text-muted': isDark ? '#999999' : 'rgba(0,0,0,0.45)',
              '--ff-color-divider': isDark ? '#555555' : 'rgba(0,0,0,0.12)',
              '--ff-color-divider-hover': isDark ? '#666666' : 'rgba(0,0,0,0.2)',
              '--ff-input-border': isDark ? '#555555' : 'rgba(0,0,0,0.23)',
              '--ff-input-border-hover': isDark ? '#888888' : 'rgba(0,0,0,0.87)',
              '--ff-color-frame-border': isDark ? '#555555' : '#aeaeae',
              '--ff-color-frame-border-hover': isDark ? '#888888' : '#2a2a2a',
              '--ff-color-primary-surface': isDark ? '#3d1010' : '#f3e8e8',
            },
          }}
        />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}

export function useThemeMode() {
  return useContext(ThemeContext)
}
