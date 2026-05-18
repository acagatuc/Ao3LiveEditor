import { createTheme, type Theme } from '@mui/material/styles'

export function buildTheme(mode: 'light' | 'dark'): Theme {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#7b1d1d',
        contrastText: '#ffffff',
      },
      background: {
        default: isDark ? '#333333' : '#e9e8e8',
        paper: isDark ? '#2a2a2a' : '#ffffff',
      },
      text: {
        primary: isDark ? '#eeeeee' : '#2a2a2a',
        secondary: isDark ? '#999999' : '#555555',
      },
      divider: isDark ? '#555555' : 'rgba(0,0,0,0.12)',
    },
    typography: {
      fontFamily: "'Lucida Grande', Verdana, sans-serif",
    },
    components: {
      MuiButton: {
        styleOverrides: {
          // In dark mode, primary-colored buttons switch to neutral grey
          // so dark red doesn't disappear against dark backgrounds.
          root: ({ ownerState }: any) => {
            if (!isDark || ownerState.color !== 'primary') return {}
            if (ownerState.variant === 'contained') {
              return {
                backgroundColor: '#555555',
                color: '#eeeeee',
                '&:hover': { backgroundColor: '#666666' },
              }
            }
            if (ownerState.variant === 'outlined') {
              return {
                borderColor: '#666666',
                color: '#cccccc',
                '&:hover': {
                  borderColor: '#888888',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                },
              }
            }
            if (ownerState.variant === 'text') {
              return { color: '#cccccc' }
            }
            return {}
          },
        },
      },
    },
    custom: {
      toolbar: {
        bg: isDark ? '#5c1515' : '#7b1d1d',
        dividerColor: 'rgba(255,255,255,0.2)',
        taglineColor: 'rgba(255,255,255,0.45)',
        hoverBg: 'rgba(255,255,255,0.1)',
      },
      wordmarkFont: 'Georgia, "Times New Roman", serif',
    },
  })
}
