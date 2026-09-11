interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN: string
  readonly VITE_API_URL: string
}

interface Window {
  gtag?: (...args: unknown[]) => void
}
