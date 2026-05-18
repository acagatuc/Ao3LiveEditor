import '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Theme {
    custom: {
      toolbar: {
        bg: string
        dividerColor: string
        taglineColor: string
        hoverBg: string
      }
      wordmarkFont: string
    }
  }
  interface ThemeOptions {
    custom?: {
      toolbar?: {
        bg?: string
        dividerColor?: string
        taglineColor?: string
        hoverBg?: string
      }
      wordmarkFont?: string
    }
  }
}
