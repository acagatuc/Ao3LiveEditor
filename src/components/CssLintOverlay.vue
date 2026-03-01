<template>
  <div ref="rootEl" class="lint-overlay" aria-hidden="true" :style="overlayStyle">
    <div :style="clipStyle">
      <div
        v-for="line in visibleWarnedLines"
        :key="line.index"
        class="lint-line"
        :style="linePositionStyle(line.index)"
      >
        <span class="lint-line__squiggle" :style="{ width: `${line.selectorWidth}ch` }" />
        <span class="lint-line__gutter" :class="`lint-line__gutter--${line.worstType}`">
          <span class="lint-line__dot" />
          <span class="lint-line__tooltip">
            <span
              v-for="(w, i) in line.warnings"
              :key="i"
              class="tooltip__row"
              :class="`tooltip__row--${w.type}`"
            >
              <span class="tooltip__badge">{{ typeShort(w.type) }}</span>
              {{ w.message }}
            </span>
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, type CSSProperties } from 'vue'
import type { PositionedWarning } from '../composables/useCssAnalyzer'
import type { CssWarning } from '../utilities/analyzeCss'

const props = defineProps<{
  warnings: PositionedWarning[]
  rawCss: string
}>()

// DOM
const rootEl = ref<HTMLElement | null>(null)

const measure = ref({
  offsetTop: 0,
  offsetLeft: 0,
  width: 0,
  height: 0,
  paddingTop: 8,
  paddingLeft: 16,
  fontSize: 13,
  lineHeight: 20,
  scrollTop: 0,
})

let ta: HTMLTextAreaElement | null = null
let ro: ResizeObserver | null = null

function readMeasure() {
  if (!ta || !rootEl.value) return
  const cs = window.getComputedStyle(ta)
  const parsePx = (v: string) => parseFloat(v) || 0

  const fontSize = parsePx(cs.fontSize)
  const rawLh = cs.lineHeight
  const lineHeight = rawLh === 'normal' ? Math.round(fontSize * 1.5) : parsePx(rawLh)

  // Position relative to .editor-body
  const wrap = rootEl.value.closest('.editor-body') as HTMLElement | null
  const taRect = ta.getBoundingClientRect()
  const wrapRect = wrap?.getBoundingClientRect() ?? { top: 0, left: 0 }

  measure.value = {
    offsetTop: taRect.top - wrapRect.top,
    offsetLeft: taRect.left - wrapRect.left,
    width: ta.clientWidth,
    height: ta.clientHeight,
    paddingTop: parsePx(cs.paddingTop),
    paddingLeft: parsePx(cs.paddingLeft),
    fontSize,
    lineHeight,
    scrollTop: ta.scrollTop,
  }
}

function onTextareaScroll() {
  if (ta) measure.value = { ...measure.value, scrollTop: ta.scrollTop }
}

onMounted(async () => {
  await nextTick()

  const wrap = rootEl.value?.closest('.editor-body') as HTMLElement | null
  if (!wrap) return

  ta = wrap.querySelector('textarea') as HTMLTextAreaElement | null
  if (!ta) return

  readMeasure()

  ta.addEventListener('scroll', onTextareaScroll, { passive: true })

  ro = new ResizeObserver(readMeasure)
  ro.observe(ta)
  ro.observe(wrap)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ta?.removeEventListener('scroll', onTextareaScroll)
})

// Styles

// The overlay div sits exactly over the textarea, same size
const overlayStyle = computed<CSSProperties>(() => ({
  position: 'absolute',
  top: `${measure.value.offsetTop}px`,
  left: `${measure.value.offsetLeft}px`,
  width: `${measure.value.width}px`,
  height: `${measure.value.height}px`,
  pointerEvents: 'none',
  overflow: 'hidden',
  boxSizing: 'border-box',
  zIndex: 2,
}))

// Clip container: adds textarea's own padding offset so line 1 aligns
const clipStyle = computed<CSSProperties>(() => ({
  position: 'relative',
  paddingLeft: `${measure.value.paddingLeft}px`,
  paddingRight: '20px',
  boxSizing: 'border-box',
  height: '100%',
}))

// Each warned line is absolutely positioned at its exact pixel offset,
// adjusted for the current scrollTop — so it moves with the text
function linePositionStyle(lineIndex: number): CSSProperties {
  const { paddingTop, lineHeight, scrollTop } = measure.value
  const top = paddingTop + lineIndex * lineHeight - scrollTop
  return {
    position: 'absolute',
    top: `${top}px`,
    left: `10px`,
    right: '20px',
    height: `${lineHeight}px`,
    lineHeight: `${lineHeight}px`,
    fontSize: `${measure.value.fontSize}px`,
  }
}

// Warning helpers
const TYPE_PRIORITY: Record<CssWarning['type'], number> = {
  'invalid-property': 4,
  'disallowed-atrule': 3,
  'invalid-var-usage': 2,
  'value-invalid': 2,
  'duplicate-property': 1,
  'comment-stripped': 0,
}

function worstType(ws: PositionedWarning[]): CssWarning['type'] {
  return ws.reduce((a, b) => (TYPE_PRIORITY[a.type] >= TYPE_PRIORITY[b.type] ? a : b)).type
}

const SHORT: Record<CssWarning['type'], string> = {
  'invalid-property': 'PROP',
  'duplicate-property': 'DUP',
  'disallowed-atrule': '@RULE',
  'comment-stripped': 'CMT',
  'invalid-var-usage': 'VAR',
  'value-invalid': 'VAL',
}
function typeShort(t: CssWarning['type']) {
  return SHORT[t] ?? t
}

// All warned lines (not just visible)
interface AnnotatedLine {
  index: number
  hasWarning: boolean
  warnings: PositionedWarning[]
  worstType: CssWarning['type']
  selectorWidth: number
}

const allAnnotatedLines = computed<AnnotatedLine[]>(() => {
  const byLine = new Map<number, PositionedWarning[]>()
  for (const w of props.warnings) {
    if (w.line == null) continue
    const bucket = byLine.get(w.line) ?? []
    bucket.push(w)
    byLine.set(w.line, bucket)
  }

  return props.rawCss.split('\n').map((text, i) => {
    const ws = byLine.get(i + 1) ?? []
    const hasWarning = ws.length > 0
    const selectorText = (text.split('{')[0] ?? text).trimEnd()
    return {
      index: i,
      hasWarning,
      warnings: ws,
      worstType: hasWarning ? worstType(ws) : 'comment-stripped',
      selectorWidth: selectorText.length - 1,
    }
  })
})

// positioned so there's no layout cost for non-visible lint warnings
const visibleWarnedLines = computed(() => allAnnotatedLines.value.filter((l) => l.hasWarning))
</script>

<style scoped>
.lint-overlay {
  pointer-events: none;
}

/* Squiggle */
.lint-line__squiggle {
  position: absolute;
  top: 55%;
  left: 0;
  height: 3px;
  min-width: 4ch;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='3'%3E%3Cpath d='M0 3 L3 0 L6 3' stroke='%23f59e0b' stroke-width='1.2' fill='none'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-size: 6px 3px;
  opacity: 0.85;
}

/* Gutter dot */
.lint-line__gutter {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: auto;
  display: flex;
  align-items: center;
  cursor: default;
}

.lint-line__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: block;
  transition: transform 0.1s;
}

.lint-line__gutter--invalid-property .lint-line__dot {
  background: #ef4444;
}
.lint-line__gutter--disallowed-atrule .lint-line__dot {
  background: #a855f7;
}
.lint-line__gutter--invalid-var-usage .lint-line__dot {
  background: #10b981;
}
.lint-line__gutter--duplicate-property .lint-line__dot {
  background: #f59e0b;
}
.lint-line__gutter--comment-stripped .lint-line__dot {
  background: #3b82f6;
}
.lint-line__gutter--value-invalid .lint-line__dot {
  background: #7c3aed;
}

.lint-line__gutter:hover .lint-line__dot {
  transform: scale(1.4);
}

/* Tooltip */
.lint-line__tooltip {
  display: none;
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: #111;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 6px 8px;
  min-width: 220px;
  max-width: 340px;
  z-index: 100;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  font-family: 'JetBrains Mono', 'Fira Mono', 'Consolas', monospace;
  font-size: 11px;
  white-space: normal;
  word-break: break-word;
}

.lint-line__gutter:hover .lint-line__tooltip {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tooltip__row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: #e5e7eb;
  line-height: 1.4;
}

.tooltip__badge {
  flex-shrink: 0;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.tooltip__row--invalid-property .tooltip__badge {
  background: #7f1d1d;
  color: #fca5a5;
}
.tooltip__row--duplicate-property .tooltip__badge {
  background: #78350f;
  color: #fde68a;
}
.tooltip__row--disallowed-atrule .tooltip__badge {
  background: #4c1d95;
  color: #ddd6fe;
}
.tooltip__row--comment-stripped .tooltip__badge {
  background: #1e3a5f;
  color: #93c5fd;
}
.tooltip__row--invalid-var-usage .tooltip__badge {
  background: #064e3b;
  color: #6ee7b7;
}
.tooltip__row--value-invalid .tooltip__badge {
  background: #7c3aed;
  color: #ddd6fe;
}
</style>
