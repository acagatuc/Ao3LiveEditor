import { useState, useMemo, useCallback } from 'react'
import { analyzeCss } from '../utilities/analyzeCss'
import type { CssAnalysis, CssWarning, CssRule } from '../utilities/analyzeCss'

export type LintStatus = 'idle' | 'clean' | 'warnings' | 'error'

export function useCssAnalyzer() {
  const [rawCss, setRawCss] = useState('')
  const [analysis, setAnalysis] = useState<CssAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const warnings = useMemo<CssWarning[]>(() => analysis?.warnings ?? [], [analysis])

  const rules = useMemo<CssRule[]>(() => analysis?.rules ?? [], [analysis])

  const status = useMemo<LintStatus>(() => {
    if (lastError) return 'error'
    if (!analysis) return 'idle'
    return warnings.length > 0 ? 'warnings' : 'clean'
  }, [lastError, analysis, warnings])

  const analyze = useCallback((css: string, allowVars = false) => {
    setRawCss(css)
    setLastError(null)
    setIsAnalyzing(true)
    try {
      setAnalysis(analyzeCss(css, { allowCssVariables: allowVars }))
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err))
      setAnalysis(null)
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const reset = useCallback(() => {
    setRawCss('')
    setAnalysis(null)
    setLastError(null)
  }, [])

  return { rawCss, isAnalyzing, lastError, warnings, rules, status, analyze, reset }
}
