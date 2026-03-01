<!--
  Displays a collapsible banner summarising all CSS lint warnings.
  Receives warnings + summary counts from useCssAnalyzer via props.
-->
<template>
  <Transition name="banner-slide">
    <div
      v-if="visible && warnings.length > 0"
      class="css-warning-banner"
      :class="{ 'is-collapsed': collapsed }"
      role="alert"
      aria-live="polite"
    >
      <!-- Header -->
      <div class="banner__header" @click="collapsed = !collapsed">
        <span class="banner__icon">⚠</span>

        <span class="banner__title">
          {{ warnings.length }} lint {{ warnings.length === 1 ? 'warning' : 'warnings' }}
        </span>

        <!-- Pill summary chips -->
        <span class="banner__chips">
          <span
            v-for="[type, count] in activeSummary"
            :key="type"
            class="chip"
            :class="`chip--${type}`"
            :title="typeLabel(type)"
          >
            {{ typeShort(type) }}&nbsp;{{ count }}
          </span>
        </span>

        <span class="banner__spacer" />

        <v-btn
          :icon="collapsed ? 'mdi-menu-down' : 'mdi-menu-up'"
          :aria-label="collapsed ? 'Expand warnings' : 'Collapse warnings'"
          density="compact"
          variant="text"
          size="x-small"
          @click.stop="collapsed = !collapsed"
        />

        <v-btn
          icon="mdi-close"
          aria-label="Dismiss warnings"
          density="compact"
          variant="text"
          size="x-small"
          @click.stop="$emit('dismiss')"
        />
      </div>

      <!-- Warning List -->
      <Transition name="list-expand">
        <ul v-if="!collapsed" class="banner__list" role="list">
          <li
            v-for="(w, i) in warnings"
            :key="i"
            class="banner__item"
            :class="`banner__item--${w.type}`"
            :title="w.selector ? `Selector: ${w.selector}` : undefined"
            tabindex="0"
            role="button"
            @click="$emit('jump', w)"
            @keydown.enter="$emit('jump', w)"
          >
            <span class="item__badge" :class="`badge--${w.type}`">
              {{ typeShort(w.type) }}
            </span>

            <span class="item__msg">{{ w.message }}</span>

            <span v-if="w.line" class="item__line">line {{ w.line }}</span>
          </li>
        </ul>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PositionedWarning } from '@/composables/useCssAnalyzer'
import type { CssWarning } from '../utilities/analyzeCss'

// Props
const props = withDefaults(
  defineProps<{
    warnings: PositionedWarning[]
    visible?: boolean
  }>(),
  { visible: true },
)

// Emits
// dismiss when the user clicks the close button
// jump when they click a warning to jump to it in the editor
defineEmits<{
  (e: 'dismiss'): void
  (e: 'jump', warning: PositionedWarning): void
}>()

// Local state
const collapsed = ref(false)

/** Only types that have at least one warning. */
const activeSummary = computed<[CssWarning['type'], number][]>(() => {
  const map = new Map<CssWarning['type'], number>()
  for (const w of props.warnings) {
    map.set(w.type, (map.get(w.type) ?? 0) + 1)
  }
  return [...map.entries()]
})

// Helpers
const SHORT: Record<CssWarning['type'], string> = {
  'invalid-property': 'PROP',
  'duplicate-property': 'DUP',
  'disallowed-atrule': '@RULE',
  'comment-stripped': 'CMT',
  'invalid-var-usage': 'VAR',
  'value-invalid': 'VAL',
}
const LABEL: Record<CssWarning['type'], string> = {
  'invalid-property': 'Invalid property',
  'duplicate-property': 'Duplicate property',
  'disallowed-atrule': 'Disallowed @rule',
  'comment-stripped': 'Comment stripped',
  'invalid-var-usage': 'Invalid var() usage',
  'value-invalid': 'Invalid value',
}

function typeShort(t: CssWarning['type']) {
  return SHORT[t] ?? t
}
function typeLabel(t: CssWarning['type']) {
  return LABEL[t] ?? t
}
</script>

<style scoped>
/* Design */
.css-warning-banner {
  --banner-bg: #1a1a1a;
  --banner-border: #f59e0b;
  --banner-text: #e5e7eb;
  --banner-sub: #9ca3af;
  --banner-radius: 4px;
  --banner-font: 'JetBrains Mono', 'Fira Mono', 'Consolas', monospace;

  font-family: var(--banner-font);
  font-size: 12px;
  background: var(--banner-bg);
  border-left: 3px solid var(--banner-border);
  border-radius: var(--banner-radius);
  color: var(--banner-text);
  overflow: hidden;
  user-select: none;
  margin: 0 8px;
}

/* Header */
.banner__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s;
}

.css-warning-banner:not(.is-collapsed) .banner__header {
  border-bottom-color: #2d2d2d;
}

.banner__icon {
  color: #f59e0b;
  font-size: 13px;
  flex-shrink: 0;
}

.banner__title {
  font-weight: 600;
  color: #f59e0b;
  white-space: nowrap;
}

/* Chips */
.banner__chips {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.chip {
  padding: 1px 5px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.chip--invalid-property {
  background: #7f1d1d;
  color: #fca5a5;
}
.chip--duplicate-property {
  background: #78350f;
  color: #fde68a;
}
.chip--disallowed-atrule {
  background: #4c1d95;
  color: #ddd6fe;
}
.chip--comment-stripped {
  background: #1e3a5f;
  color: #93c5fd;
}
.chip--invalid-var-usage {
  background: #064e3b;
  color: #6ee7b7;
}

.banner__spacer {
  flex: 1;
}

/* List */
.banner__list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  max-height: 220px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #3d3d3d transparent;
}

.banner__item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 5px 10px;
  cursor: pointer;
  transition: background 0.1s;
  outline: none;
}
.banner__item:hover,
.banner__item:focus {
  background: #242424;
}

.item__badge {
  flex-shrink: 0;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.badge--invalid-property {
  background: #7f1d1d;
  color: #fca5a5;
}
.badge--duplicate-property {
  background: #78350f;
  color: #fde68a;
}
.badge--disallowed-atrule {
  background: #4c1d95;
  color: #ddd6fe;
}
.badge--comment-stripped {
  background: #1e3a5f;
  color: #93c5fd;
}
.badge--invalid-var-usage {
  background: #064e3b;
  color: #6ee7b7;
}

.item__msg {
  flex: 1;
  color: var(--banner-text);
  line-height: 1.4;
}

.item__line {
  flex-shrink: 0;
  color: var(--banner-sub);
  font-size: 10px;
}

/* Transitions */
.banner-slide-enter-active,
.banner-slide-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.banner-slide-enter-from,
.banner-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.list-expand-enter-active,
.list-expand-leave-active {
  transition:
    max-height 0.2s ease,
    opacity 0.2s;
  overflow: hidden;
}
.list-expand-enter-from,
.list-expand-leave-to {
  max-height: 0;
  opacity: 0;
}
.list-expand-enter-to,
.list-expand-leave-from {
  max-height: 220px;
}
</style>
