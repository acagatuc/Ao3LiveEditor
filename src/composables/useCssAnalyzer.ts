// Wraps the analyzeCss function for reactive use in Vue components.
// Triggered on demand (e.g. button press); exposes warnings, rules, and status.

import { ref, computed } from 'vue'
import { analyzeCss } from '../utilities/analyzeCss'
import type { CssAnalysis, CssWarning, CssRule } from '../utilities/analyzeCss'

export type LintStatus = 'idle' | 'clean' | 'warnings' | 'error'

/**
 * A warning enriched with the line number(s) in the original CSS string
 * where the offending rule was found, so the overlay can position markers.
 */
export interface PositionedWarning extends CssWarning {
  /** 1-based line number of the selector in the raw CSS, if determinable. */
  line?: number
}

function findSelectorLine(rawCss: string, selector: string): number | undefined {
  const lines = rawCss.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]?.includes(selector)) return i + 1
  }
  return undefined
}

function enrichWarnings(rawCss: string, warnings: CssWarning[]): PositionedWarning[] {
  return warnings.map((w) => ({
    ...w,
    line: w.selector ? findSelectorLine(rawCss, w.selector) : undefined,
  }))
}

export function useCssAnalyzer() {
  const rawCss = ref('')
  const analysis = ref<CssAnalysis | null>(null)
  const isAnalyzing = ref(false)
  const lastError = ref<string | null>(null)

  const warnings = computed<PositionedWarning[]>(() => {
    if (!analysis.value) return []
    return enrichWarnings(rawCss.value, analysis.value.warnings)
  })

  const rules = computed<CssRule[]>(() => analysis.value?.rules ?? [])

  const status = computed<LintStatus>(() => {
    if (lastError.value) return 'error'
    if (!analysis.value) return 'idle'
    return warnings.value.length > 0 ? 'warnings' : 'clean'
  })

  /** Grouped warning counts for the banner summary. */
  const warningSummary = computed(() => {
    const counts: Record<CssWarning['type'], number> = {
      'invalid-property': 0,
      'duplicate-property': 0,
      'disallowed-atrule': 0,
      'comment-stripped': 0,
      'invalid-var-usage': 0,
      'value-invalid': 0,
    }
    for (const w of warnings.value) counts[w.type]++
    return counts
  })

  /**
   * Run the analyzer against the current rawCss value.
   * @param css           The raw CSS string to analyze.
   * @param allowVars     Whether CSS custom properties (var()) are permitted.
   */
  function analyze(css: string, allowVars = false) {
    rawCss.value = css
    lastError.value = null
    isAnalyzing.value = true

    try {
      analysis.value = analyzeCss(css, { allowCssVariables: allowVars })
    } catch (err) {
      lastError.value = err instanceof Error ? err.message : String(err)
      analysis.value = null
    } finally {
      isAnalyzing.value = false
    }
  }

  /** Reset all state (e.g. when the editor content is cleared). */
  function reset() {
    rawCss.value = ''
    analysis.value = null
    lastError.value = null
  }

  return {
    // State
    rawCss,
    isAnalyzing,
    lastError,
    // Derived
    warnings,
    rules,
    status,
    warningSummary,
    // Actions
    analyze,
    reset,
  }
}
