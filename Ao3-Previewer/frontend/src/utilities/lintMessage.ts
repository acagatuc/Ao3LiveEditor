import type cssWarnings from '../locales/en/cssWarnings.json'

/**
 * A lint message as a translation key plus its values, so the CSS validators stay free of
 * UI text and the warning UI renders it in the active language.
 */
export interface LintMessage {
  key: keyof typeof cssWarnings.messages
  params?: Record<string, string | number>
}
