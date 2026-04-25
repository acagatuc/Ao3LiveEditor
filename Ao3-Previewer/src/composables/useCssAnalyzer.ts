import { useState, useMemo, useCallback } from 'react'
import { analyzeCss, type CssWarning } from '../utilities/analyzeCss'

export type LintStatus = 'idle' | 'clean' | 'warnings' | 'error'

export interface PositionedWarning extends CssWarning {
  line?: number
}

function findSelectorLine(rawCss: string, selector: string): number | undefined {
  const lines = rawCss.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]?.includes(selector)) return i + 1
  }
  return undefined
}

export function useCssAnalyzer() {
  const [rawCss, setRawCss] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<ReturnType<typeof analyzeCss> | null>(null)

  const warnings = useMemo<PositionedWarning[]>(() => {
    if (!analysisResult) return []
    return analysisResult.warnings.map((w) => ({
      ...w,
      line: w.selector ? findSelectorLine(rawCss, w.selector) : undefined,
    }))
  }, [analysisResult, rawCss])

  const rules = useMemo(() => analysisResult?.rules ?? [], [analysisResult])

  const status = useMemo<LintStatus>(() => {
    if (!analysisResult) return 'idle'
    if (lastError) return 'error'
    if (warnings.length > 0) return 'warnings'
    return 'clean'
  }, [analysisResult, lastError, warnings.length])

  const warningSummary = useMemo(() => {
    return warnings.reduce<Record<string, number>>((acc, w) => {
      acc[w.type] = (acc[w.type] ?? 0) + 1
      return acc
    }, {})
  }, [warnings])

  const analyze = useCallback((css: string, allowVars = false) => {
    setIsAnalyzing(true)
    setLastError(null)
    setRawCss(css)
    try {
      const result = analyzeCss(css, { allowCssVariables: allowVars })
      setAnalysisResult(result)
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err))
      setAnalysisResult(null)
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const reset = useCallback(() => {
    setRawCss('')
    setIsAnalyzing(false)
    setLastError(null)
    setAnalysisResult(null)
  }, [])

  return { rawCss, isAnalyzing, lastError, warnings, rules, status, warningSummary, analyze, reset }
}
